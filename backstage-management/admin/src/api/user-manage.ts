import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getUsers = (params?: object) =>
  http.request<Result>("post", "/account/user/list", { data: params });

export const getUser = (id: number) =>
  http.request<Result>("post", `/account/user/detail/${id}`);

export const createUser = (data: object) =>
  http.request<Result>("post", "/account/user/add", { data });

export const updateUser = (id: number, data: object) =>
  http.request<Result>("patch", `/account/user/update/${id}`, { data });

export const deleteUser = (id: number) =>
  http.request<Result>("delete", `/account/user/delete/${id}`);

export const approveUser = (id: number) =>
  http.request<Result>("patch", `/account/user/approve/${id}`);

export const rejectUser = (id: number) =>
  http.request<Result>("patch", `/account/user/reject/${id}`);

export const resetUserPassword = (id: number, data: { password: string }) =>
  http.request<Result>("patch", `/account/user/reset-password/${id}`, { data });
