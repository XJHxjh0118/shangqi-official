const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/product/list",
  meta: {
    title: "首页",
    showLink: false,
    rank: 0
  },
  children: [
    {
      path: "/welcome",
      name: "Welcome",
      redirect: "/product/list",
      meta: {
        title: "首页",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
