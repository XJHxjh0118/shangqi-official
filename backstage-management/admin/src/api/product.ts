import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getProducts = (params?: object) =>
  http.request<Result>("post", "/product/list", { data: params });

export const getProduct = (id: number) =>
  http.request<Result>("post", `/product/detail/${id}`);

export const createProduct = (data: object) =>
  http.request<Result>("post", "/product/add", { data });

export const updateProduct = (id: number, data: object) =>
  http.request<Result>("patch", `/product/update/${id}`, { data });

export const deleteProduct = (id: number) =>
  http.request<Result>("delete", `/product/delete/${id}`);

export const batchUpdateProducts = (data: object) =>
  http.request<Result>("patch", "/product/batch", { data });

export const batchDeleteProducts = (ids: number[]) =>
  http.request<Result>("delete", "/product/batch", { data: { ids } });

export const exportProducts = (ids: number[]) =>
  http.request<Blob>("post", "/product/export", {
    data: { ids: ids.join(",") },
    responseType: "blob",
    timeout: 60000
  } as any);

export const downloadProductImportTemplate = () =>
  http.request<Blob>("post", "/product/import-template", {
    responseType: "blob"
  } as any);

export type ProductImportResult = {
  previewId?: string;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  list: any[];
};

export const importProducts = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return http.request<Result<ProductImportResult>>("post", "/product/import", {
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000
  });
};

export const confirmImportProducts = (previewId: string, skus: string[]) =>
  http.request<Result<ProductImportResult>>("post", "/product/import/confirm", {
    data: { previewId, skus },
    timeout: 60000
  });

export const removeImportedProduct = (id: number) =>
  http.request<Result>("delete", `/product/import/${id}`);
