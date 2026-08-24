import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

export type ContactPerson = {
  id: number;
  regionZh: string;
  regionEn: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  sort: number;
  enabled: boolean;
};

export const getContacts = () =>
  http.request<Result<ContactPerson[]>>("get", "/contact/list");

export const createContact = (data: Partial<ContactPerson>) =>
  http.request<Result>("post", "/contact/add", { data });

export const updateContact = (id: number, data: Partial<ContactPerson>) =>
  http.request<Result>("patch", `/contact/update/${id}`, { data });

export const deleteContact = (id: number) =>
  http.request<Result>("delete", `/contact/delete/${id}`);
