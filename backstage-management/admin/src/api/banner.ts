import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getBanners = () => http.request<Result>("get", "/cms/banner/list");

export const createBanner = (data: object) =>
  http.request<Result>("post", "/cms/banner/add", { data });

export const updateBanner = (id: number, data: object) =>
  http.request<Result>("patch", `/cms/banner/update/${id}`, { data });

export const deleteBanner = (id: number) =>
  http.request<Result>("delete", `/cms/banner/delete/${id}`);

export const sortBanners = (ids: number[]) =>
  http.request<Result>("patch", "/cms/banner/sort", { data: { ids } });
