import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import useTranslation from "@/locale/useTranslation";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { RiSeoLine } from "react-icons/ri";
import { SeoFormSchema } from "./schema";
import { z } from "zod";
import {
  useCreateSeoMutation,
  useGetSeoByIdQuery,
  useUpdateSeoByIdMutation,
} from "@/redux/services/seo";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import MultiInput from "@/components/MultipleInput";
import Select from "@/components/Select";
import { SEO_PAGES_OPTIONS } from "@/constants/StaticDropdownConstants";

type AddEditSeoFormProps = {
  isOpen: boolean;
  editId: null | number;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type SeoFormType = z.infer<typeof SeoFormSchema>;

export default function AddEditSeoForm({
  isOpen,
  editId,
  setIsOpen,
}: Readonly<AddEditSeoFormProps>) {
  const translate = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SeoFormType>({
    resolver: zodResolver(SeoFormSchema),
  });

  const [createSeo] = useCreateSeoMutation();
  const [updateSeo] = useUpdateSeoByIdMutation();
  const {
    data: getSeo,
    isSuccess: success,
    refetch,
  } = useGetSeoByIdQuery(editId, { skip: editId === null });

  // useEffect(() => {
  //   if (isOpen) {
  //     reset();
  //   }
  // }, [isOpen]);

  useEffect(() => {
    if (editId !== null) {
      refetch();
      if (getSeo?.data) {
        reset({ ...getSeo.data });
      }
    } else {
      reset({
        title: "",
        pageName: "",
        author: "",
        description: "",
        og_title: "",
        og_description: "",
        keywords: [],
      });
    }
  }, [editId, getSeo, refetch, reset, success, isOpen]);

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const onSubmit = async (data: any) => {
    const body = { ...data };
    if (editId === null) {
      try {
        const response = await createSeo(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      }
    } else {
      try {
        const response = await updateSeo({ body, id: editId }).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };

  return (
    <div>
      {/* Tab Section */}
      <div className="flex mt-[4rem] mb-[1.5rem]">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white ">
          <RiSeoLine />
          <p className="font-[500] text-[15px]">SEO</p>
        </p>
      </div>

      <div className="flex gap-[1.5rem] mb-[2.5rem]">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] w-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            label="Title"
            placeholder="Title"
            type="text"
            {...register("title")}
            error={errors.title?.message}
          />
          <Controller
            name="pageName"
            control={control}
            render={({ field }) => (
              <Select {...field} options={SEO_PAGES_OPTIONS} label="Page" />
            )}
          />

          <Input
            label="Author"
            placeholder="Author"
            type="text"
            {...register("author")}
            error={errors.author?.message}
          />

          <Input
            label="OG Title"
            placeholder="OG Title"
            type="text"
            {...register("og_title")}
            error={errors.og_title?.message}
          />
          <TextArea
            label="OG Description"
            {...register("og_description")}
            error={errors?.og_description?.message}
          />
          <TextArea
            label="Description"
            {...register("description")}
            error={errors?.description?.message}
          />
          <MultiInput
            className="flex flex-col items-start"
            name="keywords"
            label=" Keywords"
            control={control}
            placeholder="Press Enter Keywords"
            error={errors.keywords?.message}
          />

          <br />
          <Button type="submit" className="submit-button">
            <div className="flex justify-center items-center gap-[0.5rem] ">
              {translate("Submit")}
            </div>
          </Button>
        </form>
      </div>
    </div>
  );
}
