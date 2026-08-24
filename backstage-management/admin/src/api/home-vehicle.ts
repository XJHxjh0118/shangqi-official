import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getHomeVehicles = () =>
  http.request<Result>("get", "/cms/vehicle/list");

export const getHomeVehicleOptions = () =>
  http.request<Result>("get", "/cms/vehicle/options");

export const createHomeVehicle = (data: object) =>
  http.request<Result>("post", "/cms/vehicle/add", { data });

export const updateHomeVehicle = (id: number, data: object) =>
  http.request<Result>("patch", `/cms/vehicle/update/${id}`, { data });

export const deleteHomeVehicle = (id: number) =>
  http.request<Result>("delete", `/cms/vehicle/delete/${id}`);
