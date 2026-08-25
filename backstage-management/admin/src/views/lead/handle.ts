export const HANDLE_METHODS = [
  { value: "PHONE", label: "电话沟通" },
  { value: "EMAIL", label: "邮件回复" },
  { value: "CHAT", label: "即时通讯" },
  { value: "OTHER", label: "其他" }
] as const;

export const HANDLE_RESULTS = [
  { value: "REPLIED", label: "已回复客户" },
  { value: "QUOTED", label: "已报价跟进" },
  { value: "INVALID", label: "无效信息" },
  { value: "CLOSED", label: "暂不跟进" }
] as const;

export type HandleLeadPayload = {
  handleMethod: string;
  handleResult: string;
  handleRemark: string;
};

export function handleOptionLabel(
  options: readonly { value: string; label: string }[],
  value?: string | null
) {
  return options.find(item => item.value === value)?.label || value || "-";
}
