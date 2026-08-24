import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getPageSeos = () => http.request<Result>("get", "/seo/list");

export const upsertPageSeo = (data: object) =>
  http.request<Result>("put", "/seo/update", { data });
