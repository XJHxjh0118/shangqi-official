const Layout = () => import("@/layout/index.vue");

export default {
  path: "/seo",
  name: "Seo",
  component: Layout,
  redirect: "/seo/pages",
  meta: {
    icon: "ep/search",
    title: "页面SEO配置",
    rank: 6,
    menu: "seo"
  },
  children: [
    {
      path: "/seo/pages",
      name: "SeoPages",
      component: () => import("@/views/cms/seo.vue"),
      meta: {
        title: "页面SEO",
        showParent: false,
        menu: "seo:pages"
      }
    },
    {
      path: "/seo/home",
      redirect: "/seo/pages",
      meta: {
        showLink: false,
        menu: "seo:pages"
      }
    },
    {
      path: "/seo/about",
      redirect: "/seo/pages",
      meta: {
        showLink: false,
        menu: "seo:pages"
      }
    }
  ]
} satisfies RouteConfigsTable;
