import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getMessages = (params?: object) =>
  http.request<Result>("post", "/message/list", { data: params });

export const getMessage = (id: number) =>
  http.request<Result>("post", `/message/detail/${id}`);

export const handleMessage = (
  id: number,
  data: { handleMethod: string; handleResult: string; handleRemark: string }
) => http.request<Result>("patch", `/message/handle/${id}`, { data });
