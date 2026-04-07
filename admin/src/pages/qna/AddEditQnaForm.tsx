import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import useTranslation from "@/locale/useTranslation";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { RiSeoLine } from "react-icons/ri";
import { z } from "zod";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { QnaFormSchema } from "./schema";
import {
  useCreateQnaMutation,
  useGetQnaByIdQuery,
  useUpdateQnaByIdMutation,
} from "@/redux/services/qna";
import Select from "@/components/Select";

type AddEditQnaFormProps = {
  isOpen: boolean;
  editId: null | number;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type QnaFormType = z.infer<typeof QnaFormSchema>;

export default function AddEditQnaForm({
  isOpen,
  editId,
  setIsOpen,
}: Readonly<AddEditQnaFormProps>) {
  const translate = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<QnaFormType>({
    resolver: zodResolver(QnaFormSchema),
  });

  const [createQna] = useCreateQnaMutation();
  const [updateQna] = useUpdateQnaByIdMutation();
  const {
    data: getQna,
    isSuccess: success,
    refetch,
  } = useGetQnaByIdQuery(editId, { skip: editId === null });

  useEffect(() => {
    if (editId !== null) {
      refetch();
      if (getQna?.data) {
        reset({ ...getQna.data });
      }
    } else {
      reset({
        question: "",
        answer: "",
        pathName: "",
        pathLink: "",
      });
    }
  }, [editId, getQna, refetch, reset, success]);

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const onSubmit = async (data: any) => {
    const body = { ...data };
    if (editId === null) {
      try {
        const response = await createQna(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      } finally {
        reset({
          question: "",
          answer: "",
          pathName: "",
          pathLink: "",
        });
      }
    } else {
      try {
        const response = await updateQna({ body, id: editId }).unwrap();
        handleResponse({
          res: response,
          onSuccess: handleCloseDrawer,
        });
      } catch (error) {
        handleError({ error, setError });
      } finally {
        reset({
          question: "",
          answer: "",
          pathName: "",
          pathLink: "",
        });
      }
    }
  };

  return (
    <div>
      {/* Tab Section */}
      <div className="flex mt-[4rem] mb-[1.5rem]">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white">
          <RiSeoLine />
          <p className="font-[500] text-[15px]">FAQ</p>
        </p>
      </div>

      <div className="flex gap-[1.5rem] mb-[2.5rem]">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] w-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            label="Question"
            placeholder="question"
            type="text"
            {...register("question")}
            error={errors.question?.message}
          />

          <Input
            label="Path Name"
            placeholder="link"
            type="text"
            {...register("pathName")}
            error={errors.pathName?.message}
          />

          <Input
            label="Path Url"
            placeholder="https://github.com"
            type="text"
            {...register("pathLink")}
            error={errors.pathLink?.message}
          />

          <TextArea
            label="Answer"
            {...register("answer")}
            error={errors?.answer?.message}
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
