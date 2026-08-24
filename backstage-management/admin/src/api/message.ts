import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getMessages = (params?: object) =>
  http.request<Result>("get", "/message/list", { params });

export const getMessage = (id: number) =>
  http.request<Result>("get", `/message/detail/${id}`);

export const updateMessageStatus = (id: number, status: string) =>
  http.request<Result>("patch", `/message/status/${id}`, {
    data: { status }
  });
