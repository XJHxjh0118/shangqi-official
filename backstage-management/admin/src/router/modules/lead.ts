const Layout = () => import("@/layout/index.vue");

export default {
  path: "/lead",
  name: "Lead",
  component: Layout,
  redirect: "/lead/message",
  meta: {
    icon: "ep/chat-dot-round",
    title: "留言管理",
    rank: 5,
    menu: "lead"
  },
  children: [
    {
      path: "/lead/message",
      name: "LeadMessage",
      component: () => import("@/views/lead/message.vue"),
      meta: {
        title: "联系留言",
        menu: "lead:message"
      }
    },
    {
      path: "/lead/inquiry",
      name: "LeadInquiry",
      component: () => import("@/views/lead/inquiry.vue"),
      meta: {
        title: "产品询盘",
        menu: "lead:inquiry"
      }
    }
  ]
} satisfies RouteConfigsTable;
