import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getOperationLogs = (params?: object) =>
  http.request<Result>("post", "/logs/list", { data: params });
