import { http } from "@/utils/http";
import type { ListQueryParams } from "@/utils/list-query";

type Result<T = any> = { code: number; data: T; msg: string };

export const getBanners = (params?: ListQueryParams) =>
  http.request<Result>("post", "/cms/banner/list", { data: params });

export const createBanner = (data: object) =>
  http.request<Result>("post", "/cms/banner/add", { data });

export const updateBanner = (id: number, data: object) =>
  http.request<Result>("patch", `/cms/banner/update/${id}`, { data });

export const deleteBanner = (id: number) =>
  http.request<Result>("delete", `/cms/banner/delete/${id}`);

export const sortBanners = (ids: number[]) =>
  http.request<Result>("patch", "/cms/banner/sort", { data: { ids } });
