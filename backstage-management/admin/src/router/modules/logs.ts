const Layout = () => import("@/layout/index.vue");

export default {
  path: "/logs",
  name: "Logs",
  component: Layout,
  redirect: "/logs/index",
  meta: {
    icon: "ep/document",
    title: "操作日志",
    rank: 8,
    menu: "logs"
  },
  children: [
    {
      path: "/logs/index",
      name: "LogsIndex",
      component: () => import("@/views/system/operation-log.vue"),
      meta: {
        title: "操作日志",
        showParent: false,
        menu: "logs:index"
      }
    }
  ]
} satisfies RouteConfigsTable;
