import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getVehicles = () =>
  http.request<Result>("get", "/product/vehicle/list");

export const createVehicle = (data: object) =>
  http.request<Result>("post", "/product/vehicle/add", { data });

export const updateVehicle = (id: number, data: object) =>
  http.request<Result>("patch", `/product/vehicle/update/${id}`, { data });

export const deleteVehicle = (id: number) =>
  http.request<Result>("delete", `/product/vehicle/delete/${id}`);
