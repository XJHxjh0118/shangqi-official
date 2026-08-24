import { ValidationError } from 'class-validator';

const FIELD_LABELS: Record<string, string> = {
  sku: 'SKU',
  slug: 'Slug',
  categoryId: '分类',
  vehicleIds: '适配车型',
  i18n: '语言内容',
  locale: '语言',
  name: '名称',
  description: '描述',
  material: '材质',
  size: '尺寸',
  color: '颜色',
  title: '标题',
  username: '用户名',
  password: '密码',
  email: '邮箱',
  phone: '电话',
  company: '公司',
  contactName: '联系人',
  region: '地区',
  regionalManager: '区域经理',
  address: '地址',
  account: '账号',
  currentPassword: '当前密码',
  newPassword: '新密码',
  content: '内容',
  message: '留言',
  status: '状态',
  sort: '排序',
  page: '页码',
  pageSize: '每页数量',
  keyword: '关键词',
  coverUrl: '封面图',
  coverName: '封面文件名',
  promoVideoUrl: '宣传视频',
  promoVideoName: '宣传视频文件名',
  installVideoUrl: '安装视频',
  installVideoName: '安装视频文件名',
  assetPackUrl: '素材包',
  items: '列表项',
  productId: '产品',
  quantity: '数量',
  url: '文件链接',
  type: '类型',
  code: '编码',
};

function fieldLabel(path: string) {
  return path
    .split('.')
    .map((part) =>
      /^\d+$/.test(part) ? `[${part}]` : FIELD_LABELS[part] || part,
    )
    .join('.')
    .replace(/\.\[/g, '[');
}

function constraintMessage(
  key: string,
  label: string,
  raw: string,
  value: unknown,
) {
  const missing =
    value === undefined || value === null || value === '';

  switch (key) {
    case 'isDefined':
    case 'isNotEmpty':
    case 'arrayNotEmpty':
      return `缺少必填字段「${label}」`;
    case 'isString':
      return missing
        ? `缺少必填字段「${label}」`
        : `字段「${label}」必须是字符串`;
    case 'isInt':
    case 'isNumber':
      return missing
        ? `缺少必填字段「${label}」`
        : `字段「${label}」必须是数字`;
    case 'isBoolean':
      return `字段「${label}」必须是布尔值`;
    case 'isArray':
      return missing
        ? `缺少必填字段「${label}」`
        : `字段「${label}」必须是数组`;
    case 'isEnum':
      return missing
        ? `缺少必填字段「${label}」`
        : `字段「${label}」取值不正确`;
    case 'isEmail':
      return missing
        ? `缺少必填字段「${label}」`
        : `字段「${label}」不是有效的邮箱`;
    case 'isUrl':
      return `字段「${label}」不是有效的链接`;
    case 'min':
      return `字段「${label}」小于允许的最小值`;
    case 'max':
      return `字段「${label}」大于允许的最大值`;
    case 'minLength':
      return `字段「${label}」长度不足`;
    case 'maxLength':
      return `字段「${label}」超出最大长度`;
    case 'whitelistValidation':
      return `不支持的字段「${label}」`;
    case 'nestedValidation':
      return '';
    default:
      if (/must be a string/i.test(raw) && missing) {
        return `缺少必填字段「${label}」`;
      }
      if (/should not be empty/i.test(raw)) {
        return `缺少必填字段「${label}」`;
      }
      if (/must be a number|must be an integer/i.test(raw)) {
        return `字段「${label}」必须是数字`;
      }
      if (/must be an array/i.test(raw)) {
        return `字段「${label}」必须是数组`;
      }
      return `字段「${label}」校验失败：${raw}`;
  }
}

export function formatValidationErrors(
  errors: ValidationError[],
  parent = '',
): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const label = fieldLabel(path);
    if (error.constraints) {
      for (const [key, raw] of Object.entries(error.constraints)) {
        const msg = constraintMessage(key, label, raw, error.value);
        if (msg) messages.push(msg);
      }
    }
    if (error.children?.length) {
      messages.push(...formatValidationErrors(error.children, path));
    }
  }
  return [...new Set(messages)];
}

export function validationErrorMessage(errors: ValidationError[]) {
  const messages = formatValidationErrors(errors);
  return messages.join('；') || '请求参数有误';
}
