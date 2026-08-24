export type ApiEnvelope<T = unknown> = {
  code: number;
  data: T | null;
  msg: string;
};

export function ok<T>(data: T, msg = '成功'): ApiEnvelope<T> {
  return { code: 200, data, msg };
}

export function fail(
  code: number,
  msg: string,
  data: unknown = null,
): ApiEnvelope<null> {
  return { code, data: (data ?? null) as null, msg };
}
