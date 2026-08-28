import { http } from "@/utils/http";

type Result<T = any> = { code: number; data: T; msg: string };

/** 上传单个素材（字段名 file，与后端 FileInterceptor 一致） */
export const uploadAsset = (file: File, productId?: number) => {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("name", file.name);
  const query = productId ? `?productId=${productId}` : "";
  return http.request<Result>("post", `/product/asset/upload${query}`, {
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000
  });
};

/** 批量上传素材；productId 可选（新建暂存时不传） */
export const uploadAssetsBatch = (files: File[], productId?: number) => {
  const form = new FormData();
  files.forEach(file => {
    form.append("files", file, file.name);
    form.append("names", file.name);
  });
  const query = productId ? `?productId=${productId}` : "";
  return http.request<Result>("post", `/product/asset/upload-batch${query}`, {
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000
  });
};

/** 将已上传素材绑定到产�?*/
export const bindAssets = (
  productId: number,
  items: Array<{
    url: string;
    thumbnailUrl?: string | null;
    originalUrl?: string | null;
    type?: string;
    name?: string | null;
    sort?: number;
  }>
) =>
  http.request<Result>("post", `/product/asset/bind`, {
    data: { productId, items }
  });

export const getProductAssets = (productId: number) =>
  http.request<Result>("post", `/product/asset/list/${productId}`);

export const deleteAsset = (id: number) =>
  http.request<Result>("delete", `/product/asset/delete/${id}`);
