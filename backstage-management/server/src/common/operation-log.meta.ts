const RESOURCE_RULES: Array<{ test: (path: string) => boolean; label: string }> =
  [
    { test: (p) => p.includes('/product/category'), label: '产品分类' },
    { test: (p) => p.includes('/product/vehicle'), label: '车型' },
    { test: (p) => p.includes('/product/asset'), label: '产品素材' },
    { test: (p) => /\/product\/(import|export)(\/|$|\?)/.test(p), label: '产品' },
    { test: (p) => p.includes('/product'), label: '产品' },
    { test: (p) => p.includes('/cms/vehicle'), label: '适配车型' },
    { test: (p) => p.includes('/banners') || p.includes('/cms/banner'), label: 'Banner' },
    { test: (p) => p.includes('/services') || p.includes('/cms/service'), label: '服务体系' },
    { test: (p) => p.includes('/page-seo'), label: '页面SEO' },
    { test: (p) => p.includes('/users'), label: '用户账号' },
    { test: (p) => p.includes('/roles'), label: '角色' },
    { test: (p) => p.includes('/shares'), label: '分享链接' },
    { test: (p) => p.includes('/site-settings'), label: '站点配置' },
    { test: (p) => p.includes('/inquiry'), label: '询盘' },
    { test: (p) => p.includes('/message'), label: '留言' },
    { test: (p) => p.includes('/contacts'), label: '联系人' },
  ];

const NAME_KEYS = [
  'nameZh',
  'titleZh',
  'name',
  'title',
  'username',
  'nickname',
  'sku',
  'code',
  'pageKey',
  'company',
];

export const OPERATION_ACTIONS = [
  '新增',
  '修改',
  '删除',
  '导入',
  '导出',
  '排序',
  '批量修改',
  '批量删除',
  '审核通过',
  '审核拒绝',
  '重置密码',
  '更新状态',
  '绑定素材',
] as const;

export type OperationAction = (typeof OPERATION_ACTIONS)[number];

export function pathnameOf(url: string) {
  return String(url || '').split('?')[0] || '';
}

export function resourceLabelOf(path: string) {
  const pathname = pathnameOf(path);
  return RESOURCE_RULES.find((rule) => rule.test(pathname))?.label || '数据';
}

export function actionOf(method: string, path: string): OperationAction | string {
  const pathname = pathnameOf(path);
  const verb = String(method || '').toUpperCase();

  if (pathname.includes('/import')) return '导入';
  if (pathname.includes('/export')) return '导出';
  if (pathname.includes('/bind')) return '绑定素材';
  if (pathname.includes('/approve')) return '审核通过';
  if (pathname.includes('/reject')) return '审核拒绝';
  if (pathname.includes('/reset-password')) return '重置密码';
  if (/\/status(\/|$)/.test(pathname)) return '更新状态';
  if (pathname.includes('/batch') && verb === 'DELETE') return '批量删除';
  if (pathname.includes('/batch')) return '批量修改';
  if (pathname.includes('/children-sort') || /\/sort(\/|$)/.test(pathname)) {
    return '排序';
  }
  if (verb === 'POST' || pathname.includes('/add')) return '新增';
  if (verb === 'DELETE' || pathname.includes('/delete')) return '删除';
  if (verb === 'PATCH' || verb === 'PUT' || pathname.includes('/update')) {
    return '修改';
  }
  return verb || '操作';
}

function pickName(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const record = body as Record<string, unknown>;
  for (const key of NAME_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  const i18n = record.i18n;
  if (i18n && typeof i18n === 'object') {
    const locales = i18n as Record<string, unknown>;
    for (const locale of ['zh', 'en']) {
      const item = locales[locale];
      if (item && typeof item === 'object') {
        const name = (item as Record<string, unknown>).name;
        if (typeof name === 'string' && name.trim()) return name.trim();
      }
    }
  }
  return '';
}

function pickId(path: string, body: unknown): string {
  const pathname = pathnameOf(path);
  const fromPath = pathname.match(/\/(\d+)(?:\/|$)/);
  if (fromPath?.[1]) return fromPath[1];
  if (body && typeof body === 'object') {
    const id = (body as Record<string, unknown>).id;
    if (typeof id === 'number' || typeof id === 'string') return String(id);
  }
  return '';
}

function pickTargetHint(path: string, body: unknown): string {
  const name = pickName(body);
  if (name) return `「${name}」`;

  if (body && typeof body === 'object') {
    const ids = (body as Record<string, unknown>).ids;
    if (Array.isArray(ids) && ids.length) return `${ids.length} 条`;
    const status = (body as Record<string, unknown>).status;
    if (typeof status === 'string' && status.trim()) return `状态=${status}`;
  }

  const id = pickId(path, body);
  return id ? `ID=${id}` : '';
}

export function describeOperation(input: {
  username?: string | null;
  method: string;
  path: string;
  body?: unknown;
  action?: string;
}) {
  const username = input.username?.trim() || '未知用户';
  const action = input.action || actionOf(input.method, input.path);
  const resource = resourceLabelOf(input.path);
  const hint = pickTargetHint(input.path, input.body);
  return hint
    ? `${username} ${action}了${resource} ${hint}`
    : `${username} ${action}了${resource}`;
}

export function apiOf(method: string, path: string) {
  const verb = String(method || '').toUpperCase();
  const pathname = pathnameOf(path);
  return `${verb} ${pathname}`.trim();
}

function looksLikeJson(value?: string | null) {
  const text = String(value || '').trim();
  return text.startsWith('{') || text.startsWith('[');
}

export function displayAction(row: {
  action?: string | null;
  method?: string | null;
  path?: string | null;
}) {
  const current = String(row.action || '').trim();
  if (current && !/^(GET|POST|PUT|PATCH|DELETE)$/i.test(current)) {
    return current;
  }
  return actionOf(row.method || current, row.path || '');
}

export function displayDescription(row: {
  username?: string | null;
  action?: string | null;
  method?: string | null;
  path?: string | null;
  detail?: string | null;
}) {
  if (row.detail && !looksLikeJson(row.detail)) return row.detail;
  return describeOperation({
    username: row.username,
    method: row.method || '',
    path: row.path || '',
    action: displayAction(row),
  });
}

export function displayApi(row: {
  method?: string | null;
  path?: string | null;
}) {
  const path = String(row.path || '').trim();
  if (/^(GET|POST|PUT|PATCH|DELETE)\s+/i.test(path)) return path;
  return apiOf(row.method || '', path);
}
