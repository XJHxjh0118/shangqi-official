const Layout = () => import("@/layout/index.vue");

export default {
  path: "/cms",
  name: "Cms",
  component: Layout,
  redirect: "/cms/banner",
  meta: {
    icon: "ep/picture",
    title: "内容管理",
    rank: 4,
    menu: "cms"
  },
  children: [
    {
      path: "/cms/banner",
      name: "CmsBanner",
      component: () => import("@/views/cms/banner.vue"),
      meta: {
        title: "Banner管理",
        menu: "cms:banner"
      }
    },
    {
      path: "/cms/featured",
      name: "CmsFeatured",
      component: () => import("@/views/cms/featured.vue"),
      meta: {
        title: "主推推荐",
        menu: "cms:featured"
      }
    },
    {
      path: "/cms/new-hot",
      name: "CmsNewHot",
      component: () => import("@/views/cms/new-hot.vue"),
      meta: {
        title: "热门/新品",
        menu: "cms:new-hot"
      }
    },
    {
      path: "/cms/service",
      name: "CmsService",
      component: () => import("@/views/cms/service.vue"),
      meta: {
        title: "服务体系管理",
        menu: "cms:service"
      }
    },
    {
      path: "/cms/vehicle",
      name: "CmsVehicle",
      component: () => import("@/views/cms/vehicle.vue"),
      meta: {
        title: "适配车型管理",
        menu: "cms:vehicle"
      }
    }
  ]
} satisfies RouteConfigsTable;
