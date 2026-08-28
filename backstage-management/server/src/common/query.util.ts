export function parseOptionalBoolean(
  value?: string | boolean | null,
): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

export function buildKeywordOr(
  keyword: string | undefined,
  fields: string[],
): Record<string, unknown>[] | undefined {
  const k = keyword?.trim();
  if (!k) return undefined;
  return fields.map((field) => ({ [field]: { contains: k } }));
}
