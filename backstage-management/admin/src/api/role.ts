import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export type MenuNode = {
  key: string;
  title: string;
  children?: MenuNode[];
};

export type RoleItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  menus: string[];
  isSystem: boolean;
  enabled: boolean;
  sort: number;
};

export const getRoles = () =>
  http.request<Result<RoleItem[]>>("get", "/account/role/list");

export const getRoleMenus = () =>
  http.request<Result<MenuNode[]>>("get", "/account/role/menus");

export const createRole = (data: object) =>
  http.request<Result<RoleItem>>("post", "/account/role/add", { data });

export const updateRole = (id: number, data: object) =>
  http.request<Result<RoleItem>>("patch", `/account/role/update/${id}`, {
    data
  });

export const deleteRole = (id: number) =>
  http.request<Result>("delete", `/account/role/delete/${id}`);
