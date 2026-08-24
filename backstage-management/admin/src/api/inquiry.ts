import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getInquiries = (params?: object) =>
  http.request<Result>("get", "/inquiry/list", { params });

export const getInquiry = (id: number) =>
  http.request<Result>("get", `/inquiry/detail/${id}`);

export const updateInquiryStatus = (id: number, status: string) =>
  http.request<Result>("patch", `/inquiry/status/${id}`, {
    data: { status }
  });
