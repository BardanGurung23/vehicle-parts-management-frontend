import Input from "@/components/Input";
import { FieldErrors, useForm, UseFormSetError } from "react-hook-form";
import { InterviewFormType } from "./AddEditInterview";
import MediaComponent from "@/components/MediaComponent";
import { useState } from "react";
import { useAppSelector } from "@/redux/store/hooks";
import { useDispatch } from "react-redux";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import {
  useCreateInterviewMutation,
  useUpdateInterviewByIdMutation,
} from "@/redux/services/interview";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { IMAGE_BASE_URL } from "@/constants";
import { useNavigate, useParams } from "react-router-dom";
import TextArea from "@/components/TextArea";
import useTranslation from "@/locale/useTranslation";
import { EMPLOYEE_LIST_ROUTE } from "@/routes/routeNames";
import galleryIcon from "@/assets/gallery_icon.svg";

type MessagePropType = {
  register: ReturnType<typeof useForm<InterviewFormType>>["register"];
  handleSubmit: ReturnType<typeof useForm>["handleSubmit"];
  errors: FieldErrors<InterviewFormType>;
  getValues: ReturnType<typeof useForm<InterviewFormType>>["getValues"];
  setValue: ReturnType<typeof useForm<InterviewFormType>>["setValue"];
  setEmployeeId: React.Dispatch<React.SetStateAction<number | null>>;
  setError: UseFormSetError<InterviewFormType>;
};

export default function Message({
  register,
  handleSubmit,
  errors,
  getValues,
  setValue,
  setEmployeeId,
}: Readonly<MessagePropType>) {
  const translate = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [createInterview] = useCreateInterviewMutation();
  const [updateInterview] = useUpdateInterviewByIdMutation();

  const [messageImage, setMessageImage] = useState<boolean>(false);
  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const message_img = getValues("message_img");

  const handleConfirmImage = () => {
    setValue("message_img", selectedImage);
    setMessageImage(false);
    dispatch(clearSelectedMedia());
  };

  const onSubmit = async (data: any) => {
    const body = { ...data };
    try {
      const response = id
        ? await updateInterview({ body, id }).unwrap()
        : await createInterview(body).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => {
          setEmployeeId(response?.data?.id);
          navigate(EMPLOYEE_LIST_ROUTE);
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <form
      className="relative grid grid-cols-1 md:grid-cols-2 gap-[2rem] w-full md:w-[744px] border pl-[1.5rem] pt-[1.5rem] pb-[3rem] pr-[4.5rem] mt-[3rem]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="absolute top-[-0.7rem] left-[43px] px-[1rem] z-20 bg-[#FAF7FA]">
        <p className="font-[400] text-[1.25rem]">{translate("Message")} *</p>
      </div>
      <div className="flex flex-col gap-[2rem]">
        <Input
          label="Message Title"
          isRequired
          {...register("message_title")}
          error={errors?.message_title?.message}
        />
        <TextArea
          label="Message Caption"
          isRequired
          {...register("message")}
          error={errors?.message?.message}
        />
      </div>
      <div className="flex flex-col items-start">
        <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
          {translate("Message")} {translate("Image")}{" "}
          <span className="text-red-500">*</span>
        </label>
        <MediaComponent
          title={<ImageInputUI type="large" image={message_img} />}
          handleConfirmImage={handleConfirmImage}
          open={messageImage}
          setOpen={setMessageImage}
        />
      </div>
      <button type="submit" className="submit-button">
        <span className="text-white">{translate("Submit")}</span>
      </button>
    </form>
  );
}

const ImageInputUI = ({ type, image }: { type: string; image: string }) => {
  const translate = useTranslation();
  return (
    <>
      <div
        className={`h-[120px] border border-[#C9CBD1] rounded-[6px] flex items-center justify-center ${
          type === "small" ? "w-[147px] " : "w-[307px]"
        }`}
      >
        {image !== undefined ? (
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
