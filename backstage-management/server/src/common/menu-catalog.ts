export type MenuNode = {
  key: string;
  title: string;
  children?: MenuNode[];
};

/** 后台可分配菜单，与前端路由 meta.menu 对齐 */
export const MENU_CATALOG: MenuNode[] = [
  {
    key: 'product',
    title: '产品管理',
    children: [
      { key: 'product:category', title: '产品分类' },
      { key: 'product:list', title: '产品列表' },
      { key: 'product:vehicle', title: '车型管理' },
    ],
  },
  {
    key: 'cms',
    title: '内容管理',
    children: [
      { key: 'cms:banner', title: 'Banner管理' },
      { key: 'cms:featured', title: '主推推荐' },
      { key: 'cms:new-hot', title: '热门/新品' },
      { key: 'cms:service', title: '服务体系管理' },
      { key: 'cms:vehicle', title: '适配车型管理' },
    ],
  },
  {
    key: 'lead',
    title: '留言管理',
    children: [
      { key: 'lead:message', title: '联系留言' },
      { key: 'lead:inquiry', title: '产品询盘' },
    ],
  },
  {
    key: 'seo',
    title: '页面SEO配置',
    children: [{ key: 'seo:pages', title: '页面SEO' }],
  },
  {
    key: 'account',
    title: '用户管理',
    children: [
      { key: 'account:role', title: '角色管理' },
      { key: 'account:staff', title: '后台账号' },
      { key: 'account:list', title: '前台账号管理' },
    ],
  },
  {
    key: 'logs',
    title: '操作日志',
    children: [{ key: 'logs:index', title: '操作日志' }],
  },
];

/** 旧菜单 key → 新 key，角色权限平滑迁移 */
export const MENU_KEY_ALIASES: Record<string, string> = {
  catalog: 'product',
  'catalog:category': 'product:category',
  'catalog:vehicle': 'product:vehicle',
  'product:import-export': 'product:list',
  'seo:home': 'seo:pages',
  'seo:about': 'seo:pages',
};

export function normalizeMenuKey(key: string) {
  return MENU_KEY_ALIASES[key] ?? key;
}

export function normalizeMenuKeys(keys: string[]) {
  return [...new Set((keys || []).map((key) => normalizeMenuKey(key)))];
}

export function flattenMenuKeys(nodes: MenuNode[] = MENU_CATALOG): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    keys.push(node.key);
    if (node.children?.length) {
      keys.push(...flattenMenuKeys(node.children));
    }
  }
  return keys;
}

export function isValidMenuKey(key: string) {
  return flattenMenuKeys().includes(normalizeMenuKey(key));
}

export const EDITOR_MENUS = flattenMenuKeys().filter(
  (key) => !key.startsWith('account') && !key.startsWith('logs'),
);

export const ALL_MENUS = flattenMenuKeys();
