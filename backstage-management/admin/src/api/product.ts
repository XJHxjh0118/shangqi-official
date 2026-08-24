import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getProducts = (params?: object) =>
  http.request<Result>("get", "/product/list", { params });

export const getProduct = (id: number) =>
  http.request<Result>("get", `/product/detail/${id}`);

export const createProduct = (data: object) =>
  http.request<Result>("post", "/product/add", { data });

export const updateProduct = (id: number, data: object) =>
  http.request<Result>("patch", `/product/update/${id}`, { data });

export const deleteProduct = (id: number) =>
  http.request<Result>("delete", `/product/delete/${id}`);

export const batchUpdateProducts = (data: object) =>
  http.request<Result>("patch", "/product/batch", { data });

export const exportProducts = () =>
  http.request<Blob>("get", "/product/export", {
    responseType: "blob"
  } as any);

export const importProducts = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return http.request<Result>("post", "/product/import", {
    data: form,
    headers: { "Content-Type": "multipart/form-data" }
  });
};
