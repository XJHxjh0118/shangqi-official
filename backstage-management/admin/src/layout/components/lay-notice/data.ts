export interface ListItem {
  avatar?: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
  path?: string;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
  emptyText: string;
  total?: number;
  morePath?: string;
}

export const noticesData: TabItem[] = [
  {
    key: "1",
    name: "通知",
    list: [],
    emptyText: "暂无通知"
  },
  {
    key: "2",
    name: "消息",
    list: [],
    emptyText: "暂无未处理留言",
    morePath: "/lead/message"
  },
  {
    key: "3",
    name: "待办",
    list: [],
    emptyText: "暂无待审批账号",
    morePath: "/account/list"
  }
];
