import { useForm } from "react-hook-form";
import { QuestionOneSchema } from "./schema";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/store/hooks";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import Input from "@/components/Input";
import MediaComponent from "@/components/MediaComponent";
import { IMAGE_BASE_URL } from "@/constants";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateQuestionMutation,
  useDeleteQuestionByIdMutation,
  useUpdateQuestionByIdMutation,
} from "@/redux/services/questions";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { GoPlusCircle } from "react-icons/go";
import TextArea from "@/components/TextArea";
import useTranslation from "@/locale/useTranslation";
import { useNavigate } from "react-router-dom";
import { EMPLOYEE_LIST_ROUTE } from "@/routes/routeNames";
import galleryIcon from "@/assets/gallery_icon.svg";
type QuestionOneType = z.infer<typeof QuestionOneSchema>;

type QuestionnairePropsType = {
  employeeId: number | null;
  qnaData: any;
  qno: number;
  questionNumber: number;
  setQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>;
};

export default function Questionnaire({
  employeeId,
  qnaData,
  qno,
  questionNumber,
  setQuestionNumber,
  setCurrentQuestion,
}: QuestionnairePropsType) {
  const translate = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<QuestionOneType>({ resolver: zodResolver(QuestionOneSchema) });

  const [createQuestion] = useCreateQuestionMutation();
  const [updateQuestion] = useUpdateQuestionByIdMutation();
  const [deleteQuestion] = useDeleteQuestionByIdMutation();

  const [isQuestionImageOpen, setIsQuestionImageOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (qnaData === null || qnaData === undefined) {
      reset({ question: "", answer: "", img: "" });
    } else {
      reset(qnaData);
    }
  }, [qnaData, questionNumber]);
  const img = getValues("img");
  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const handleConfirmImage = () => {
    setValue("img", selectedImage);
    setIsQuestionImageOpen(false);
    dispatch(clearSelectedMedia());
  };

  const handleQuestionNumber = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setQuestionNumber((prevQuestionNumber) => {
      const updatedQuestionNumber = prevQuestionNumber + 1;
      setCurrentQuestion(updatedQuestionNumber);
      return updatedQuestionNumber;
    });
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      const response = await deleteQuestion(qnaData.id).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          navigate(EMPLOYEE_LIST_ROUTE);
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const onSubmit = async (data: any) => {
    const body = { ...data, employeeId, qno };
    if (qnaData === null || qnaData === undefined) {
      try {
        const response = await createQuestion(body).unwrap();
        handleResponse({ res: response, onSuccess: () => {} });
      } catch (error) {
        handleError({ error });
      }
    } else {
      try {
        const id = qnaData.id;
        delete body.employeeId;
        const response = await updateQuestion({ body, id }).unwrap();
        handleResponse({ res: response, onSuccess: () => {} });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-[2.25rem]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="w-full space-y-[1.5rem]">
        <Input
          label={
            <>
              {translate("Question")} {qno}
            </>
          }
          isRequired
          {...register("question")}
          error={errors?.question?.message}
        />
        <TextArea
          label={
            <>
              {translate("Answer")}
              {qno}
            </>
          }
          isRequired
          {...register("answer")}
          error={errors?.answer?.message}
        />
      </div>
      {qno <= 4 && (
        <div className="flex flex-col items-start w-full md:w-[508px]">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Upload Media")} <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUI type="large" image={img} />}
            handleConfirmImage={handleConfirmImage}
            open={isQuestionImageOpen}
            setOpen={setIsQuestionImageOpen}
          />
        </div>
      )}
      {qno === questionNumber && (
        <div className="absolute bottom-[-5rem] right-[0rem] flex justify-end items-center w-screen md:w-[920px] gap-[1rem]">
          <button
            className=" bg-[#FF7F2D] flex items-center px-[20px] py-[0.5rem] rounded-[6px] gap-[6px] text-white "
            onClick={handleQuestionNumber}
          >
            <GoPlusCircle size={22} /> {translate("Add New Question")}
          </button>
        </div>
      )}
      <div
        className={`absolute right-[0rem] flex justify-end w-screen md:w-[920px] gap-[1rem] ${
          qno === questionNumber ? "bottom-[-10rem]" : "bottom-[-5rem]"
        }`}
      >
        <button type="submit" className={`submit-button ${""}`}>
          <p className="text-white font-[400]">{translate("Continue")}</p>
        </button>
        <button
          className={`px-[20px] py-[8px] bg-red-500 rounded-[6px] ${""}`}
          onClick={handleDelete}
        >
          <p className="text-white font-[400]">{translate("Delete")}</p>
        </button>
      </div>
    </form>
  );
}

const ImageInputUI = ({ type, image }: { type: string; image?: string }) => {
  const translate = useTranslation();
  return (
    <>
      <div
        className={`h-[120px] border border-[#C9CBD1] rounded-[6px] flex items-center justify-center ${
          type === "small" ? "w-[147px] " : "w-[307px]"
        }`}
      >
        {image !== "" ? (
          <img
            src={`${IMAGE_BASE_URL}${image}`}
            alt="Gallery Icon"
            className="object-contain w-[307px] h-[60px]"
            // crossOrigin="anonymous"
          />
        ) : (
          <img src={galleryIcon} alt="Gallery Icon" />
        )}
      </div>
      {type === "large" && (
        <p className="font-[400] text-[0.75rem] text-start mt-[2px] text-[#626c78]">
          {translate("Allowed JPG, GIF or PNG. Max size of 1MB")}
        </p>
      )}
    </>
  );
};
