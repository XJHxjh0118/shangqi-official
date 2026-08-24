import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getServiceItems = () =>
  http.request<Result>("get", "/cms/service/list");

export const createServiceItem = (data: object) =>
  http.request<Result>("post", "/cms/service/add", { data });

export const updateServiceItem = (id: number, data: object) =>
  http.request<Result>("patch", `/cms/service/update/${id}`, { data });

export const deleteServiceItem = (id: number) =>
  http.request<Result>("delete", `/cms/service/delete/${id}`);
