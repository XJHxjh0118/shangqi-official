import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";

type ApiBody = {
  code?: number;
  msg?: string;
  message?: string | string[];
};

function extractApiMessage(body: unknown, fallback = "请求失败") {
  if (!body || typeof body !== "object") return fallback;
  const payload = body as ApiBody;
  if (typeof payload.msg === "string" && payload.msg.trim()) {
    return payload.msg.trim();
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  if (Array.isArray(payload.message)) {
    const joined = payload.message
      .map(item => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("；");
    if (joined) return joined;
  }
  return fallback;
}

function isApiEnvelope(body: unknown): body is ApiBody & { code: number } {
  return Boolean(body && typeof body === "object" && "code" in body);
}

function shouldSkipErrorToast(config?: PureHttpRequestConfig) {
  return Boolean(config?.skipGlobalErrorHandler);
}

function notifyApiError(msg: string) {
  message(msg, { type: "error", grouping: true });
}

function isBinaryResponse(response: PureHttpResponse) {
  const responseType = response.config?.responseType;
  const data = response.data;
  return (
    responseType === "blob" ||
    responseType === "arraybuffer" ||
    data instanceof Blob ||
    data instanceof ArrayBuffer
  );
}

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "/car",
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // FormData 不能带 application/json，否则 axios 会把文件序列化成 JSON，后端收不到 file
        if (typeof FormData !== "undefined" && config.data instanceof FormData) {
          const headers = config.headers as any;
          if (headers?.set) {
            headers.set("Content-Type", "multipart/form-data");
          } else if (headers) {
            headers["Content-Type"] = "multipart/form-data";
          }
        }
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/auth/refresh-token", "/auth/login"];
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise((resolve, reject) => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime();
                const expired = parseInt(String(data.expires)) - now <= 0;
                if (expired) {
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    useUserStoreHook()
                      .handRefreshToken({ refreshToken: data.refreshToken })
                      .then(res => {
                        if (res?.code === 200 && res?.data?.accessToken) {
                          const token = res.data.accessToken;
                          config.headers["Authorization"] = formatToken(token);
                          PureHttp.requests.forEach(cb => cb(token));
                          PureHttp.requests = [];
                          resolve(config);
                        } else {
                          PureHttp.requests = [];
                          useUserStoreHook().logOut();
                          reject(new Error("refresh token rejected"));
                        }
                      })
                      .catch(() => {
                        PureHttp.requests = [];
                        useUserStoreHook().logOut();
                        reject(new Error("refresh token failed"));
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  } else {
                    PureHttp.retryOriginalRequest(config)
                      .then(resolve)
                      .catch(reject);
                  }
                } else {
                  config.headers["Authorization"] = formatToken(
                    data.accessToken
                  );
                  resolve(config);
                }
              } else {
                resolve(config);
              }
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }

        if (isBinaryResponse(response)) {
          return response.data;
        }

        const data = response.data;
        if (isApiEnvelope(data) && data.code !== 200) {
          const apiMsg = extractApiMessage(data);
          if (!shouldSkipErrorToast($config)) {
            notifyApiError(apiMsg);
          }
          return Promise.reject(
            Object.assign(new Error(apiMsg), {
              response,
              data,
              config: $config,
              isCancelRequest: false,
              apiMsgShown: true
            })
          );
        }

        return data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        const body = $error.response?.data;
        const apiMsg = extractApiMessage(body, "");
        if (apiMsg) {
          $error.message = apiMsg;
        }
        if (!shouldSkipErrorToast($error.config) && !($error as any).apiMsgShown) {
          notifyApiError(
            apiMsg || $error.message || "网络异常，请稍后重试"
          );
          ($error as any).apiMsgShown = true;
        }
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
