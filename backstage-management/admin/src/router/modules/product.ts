const Layout = () => import("@/layout/index.vue");

export default {
  path: "/product",
  name: "Product",
  component: Layout,
  redirect: "/product/list",
  meta: {
    icon: "ep/goods",
    title: "产品管理",
    rank: 2,
    menu: "product"
  },
  children: [
    {
      path: "/product/category",
      name: "ProductCategory",
      component: () => import("@/views/product/category.vue"),
      meta: {
        title: "产品分类",
        menu: "product:category"
      }
    },
    {
      path: "/product/list",
      name: "ProductList",
      component: () => import("@/views/product/list.vue"),
      meta: {
        title: "产品列表",
        menu: "product:list"
      }
    },
    {
      path: "/product/vehicle",
      name: "ProductVehicle",
      component: () => import("@/views/product/vehicle.vue"),
      meta: {
        title: "车型",
        menu: "product:vehicle"
      }
    }
  ]
} satisfies RouteConfigsTable;
