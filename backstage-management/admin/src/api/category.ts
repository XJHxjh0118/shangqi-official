import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export const getCategories = () =>
  http.request<Result>("get", "/product/category/list");

export const getCategoriesFlat = () =>
  http.request<Result>("get", "/product/category/flat");

export const createCategory = (data: object) =>
  http.request<Result>("post", "/product/category/add", { data });

export const updateCategory = (id: number, data: object) =>
  http.request<Result>("patch", `/product/category/update/${id}`, { data });

export const deleteCategory = (id: number) =>
  http.request<Result>("delete", `/product/category/delete/${id}`);

export const sortCategoryChildren = (parentId: number, ids: number[]) =>
  http.request<Result>("patch", `/product/category/children-sort/${parentId}`, {
    data: { ids }
  });
