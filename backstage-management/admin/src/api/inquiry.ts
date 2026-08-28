import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getInquiries = (params?: object) =>
  http.request<Result>("post", "/inquiry/list", { data: params });

export const getInquiry = (id: number) =>
  http.request<Result>("post", `/inquiry/detail/${id}`);

export const handleInquiry = (
  id: number,
  data: { handleMethod: string; handleResult: string; handleRemark: string }
) => http.request<Result>("patch", `/inquiry/handle/${id}`, { data });
