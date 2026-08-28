import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getShares = () => http.request<Result>("post", "/share/list");

export const createShare = (data: object) =>
  http.request<Result>("post", "/share/add", { data });

export const updateShare = (id: number, data: object) =>
  http.request<Result>("patch", `/share/update/${id}`, { data });

export const deleteShare = (id: number) =>
  http.request<Result>("delete", `/share/delete/${id}`);
