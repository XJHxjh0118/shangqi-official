export function cleanInput(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeSubmitError(err: unknown): string {
  const typed = err as {
    data?: { msg?: string; message?: string | string[] }
    statusMessage?: string
    message?: string
  }
  const msg =
    typed?.data?.msg ||
    typed?.data?.message ||
    typed?.statusMessage ||
    typed?.message ||
    '请求失败'
  return Array.isArray(msg) ? msg.join('，') : String(msg)
}
