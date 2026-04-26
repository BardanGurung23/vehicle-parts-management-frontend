import UserProfile from "@/pages/UserProfile";
import Access from "@/pages/Access";
import EditAccess from "@/pages/Access/EditAccess";
import Dashboard from "@/pages/Dashboard";
import Media from "@/pages/Media";
import MediaImages from "@/pages/Media/mediaImages";
import Roles from "@/pages/Roles";
import Users from "@/pages/Users";
import ApproveRequest from "@/pages/ApproveRequest";
import Seo from "@/pages/Seo";
import Settings from "@/pages/Settings";
import QNA from "@/pages/qna";
import Sort from "@/pages/qna/sort";
import EmailTemplate from "@/pages/EmailTemplate";
import AddEditEmailTemplate from "@/pages/EmailTemplate/AddEditEmailTemplate";
import EmailSmtp from "@/pages/EmailSmtp";
import ActiveEmailTemplate from "@/pages/ActiveEmailTemplate";
import ProductCategory from "@/pages/ProductCategory";
import AddEditProductCategory from "@/pages/ProductCategory/AddEditProductCategory";
import Product from "@/pages/Product";
import AddEditProduct from "@/pages/Product/AddEditProduct";
import ProductVariant from "@/pages/ProductVariant";
import AddEditProductVariant from "@/pages/ProductVariant/AddEditProductVariant";
import Customer from "@/pages/Customer";
import Contact from "@/pages/Contact";
import Order from "@/pages/Order";
import Banner from "@/pages/Banner";
import AddEditBanner from "@/pages/Banner/AddEditBanner";
import AddEditTestimonial from "@/pages/Testimonial/AddEditTestimonial";
import Testimonial from "@/pages/Testimonial";
import Staff from "@/pages/Staff";
import Parts from "@/pages/Parts";

export const adminLinks = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/auth/list",
    element: <Users />,
  },
  {
    path: "/approve-request",
    element: <ApproveRequest />,
  },
  {
    path: "/roles/list",
    element: <Roles />,
  },
  {
    path: "/access",
    element: <Access />,
  },
  {
    path: "/access/:id",
    element: <EditAccess />,
  },
  {
    path: "/media-category/list",
    element: <Media />,
  },
  {
    path: "/media/:id",
    element: <MediaImages />,
  },
  {
    path: "/profile",
    element: <UserProfile />,
  },

  {
    path: "/seo/list",
    element: <Seo />,
  },
  {
    path: "/settings/list",
    element: <Settings />,
  },
  {
    path: "/faq/list",
    element: <QNA />,
  },
  {
    path: "/faq/sort",
    element: <Sort />,
  },
  {
    path: "/email-template/list",
    element: <EmailTemplate />,
  },
  {
    path: "/email-template/add",
    element: <AddEditEmailTemplate />,
  },
  {
    path: "/email-template/:id",
    element: <AddEditEmailTemplate />,
  },
  {
    path: "/smtp",
    element: <EmailSmtp />,
  },
  {
    path: "/active-email-template",
    element: <ActiveEmailTemplate />,
  },
  {
    path: "/product-category/list",
    element: <ProductCategory />,
  },
  {
    path: "/product-category/",
    element: <AddEditProductCategory />,
  },
  {
    path: "/product-category/:id",
    element: <AddEditProductCategory />,
  },
  {
    path: "/product/list",
    element: <Product />,
  },
  {
    path: "/product/",
    element: <AddEditProduct />,
  },
  {
    path: "/product/:id",
    element: <AddEditProduct />,
  },
  {
    path: "/product-variant/list",
    element: <ProductVariant />,
  },
  {
    path: "/product-variant/",
    element: <AddEditProductVariant />,
  },
  {
    path: "/product-variant/:id",
    element: <AddEditProductVariant />,
  },
  {
    path: "customer",
    element: <Customer />,
  },
  {
    path: "contact",
    element: <Contact />,
  },
  {
    path: "/order/list",
    element: <Order />,
  },
  {
    path: "/banner/list",
    element: <Banner />,
  },
  {
    path: "/banner/:id",
    element: <AddEditBanner />,
  },
  {
    path: "/testimonial/:id",
    element: <AddEditTestimonial />,
  },
  {
    path: "/testimonial",
    element: <AddEditTestimonial />,
  },
  {
    path: "/testimonial/list",
    element: <Testimonial />,
  },
  {
    path: "/staff",
    element: <Staff />,
  },
  {
    path: "/parts",
    element: <Parts />,
  },
];
