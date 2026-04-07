import PageTitle from "@/components/PageTitle/index.tsx";

import ProductForm from "./ProductForm.tsx";
import { useParams } from "react-router-dom";
import { useState } from "react";
import ProductVariantForm from "./ProductVariantForm.tsx";

export default function AddEditProduct() {
  const { id } = useParams();

  const [tab, setTab] = useState<"product" | "variant">("product");

  return (
    <>
      <PageTitle isBack title={id ? "Edit Product " : "Add Product"} />
      {tab === "product" ? <ProductForm /> : <ProductVariantForm />}
    </>
  );
}
