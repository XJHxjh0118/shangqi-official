const Layout = () => import("@/layout/index.vue");

export default {
  path: "/account",
  name: "Account",
  component: Layout,
  redirect: "/account/role",
  meta: {
    icon: "ep/user",
    title: "用户管理",
    rank: 7,
    menu: "account"
  },
  children: [
    {
      path: "/account/role",
      name: "AccountRole",
      component: () => import("@/views/system/role.vue"),
      meta: {
        title: "角色管理",
        menu: "account:role"
      }
    },
    {
      path: "/account/staff",
      name: "AccountStaff",
      component: () => import("@/views/system/user.vue"),
      meta: {
        title: "后台账号",
        menu: "account:staff"
      }
    },
    {
      path: "/account/list",
      name: "AccountList",
      component: () => import("@/views/system/account.vue"),
      meta: {
        title: "前台账号管理",
        menu: "account:list"
      }
    }
  ]
} satisfies RouteConfigsTable;
