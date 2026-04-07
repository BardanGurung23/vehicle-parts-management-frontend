import Input from "@/components/Input";
import MediaComponent from "@/components/MediaComponent";
import { IMAGE_BASE_URL } from "@/constants";
import { useEffect, useState } from "react";
import { QuestionTwoSchema } from "./schema";
import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/store/hooks";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaPlusSquare } from "react-icons/fa";
import { TbTrashXFilled } from "react-icons/tb";
import {
  useCreateTimeTableHeadingMutation,
  useDeleteTimeTableHeaderMutation,
  useUpdateTimeTableHeaderMutation,
} from "@/redux/services/questions";
import { handleError, handleResponse } from "@/utils/responseHandler";
import useTranslation from "@/locale/useTranslation";
import galleryIcon from "@/assets/gallery_icon.svg";
import { EMPLOYEE_LIST_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";

type QuestionTwoType = z.infer<typeof QuestionTwoSchema>;

export default function TimeTableQuestionnaire({
  employeeId,
  timeTableData,
}: {
  employeeId: number | null;
  timeTableData: any;
}) {
  const translate = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    getValues,
    setError,
    formState: { errors },
  } = useForm<QuestionTwoType>({
    resolver: zodResolver(QuestionTwoSchema),
    defaultValues: {
      timeTable: [{ title: "", description: "", date: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeTable",
  });

  useEffect(() => {
    if (timeTableData && timeTableData.TimeTables) {
      reset({ ...timeTableData, timeTable: timeTableData.TimeTables });
    } else {
      reset();
    }
  }, []);

  const [createTimeTable] = useCreateTimeTableHeadingMutation();
  const [updateTimeTable] = useUpdateTimeTableHeaderMutation();
  const [deleteTimeTable] = useDeleteTimeTableHeaderMutation();

  const [isImageOneOpen, setIsImageOneOpen] = useState<boolean>(false);
  const [isImageTwoOpen, setIsImageTwoOpen] = useState<boolean>(false);

  const img_one = getValues("img_one");
  const img_two = getValues("img_two");
  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  const handleConfirmImage = (field: string) => {
    if (field === "img_one") {
      setValue("img_one", selectedImage);
      setIsImageOneOpen(false);
    } else {
      setValue("img_two", selectedImage);
      setIsImageTwoOpen(false);
    }
    dispatch(clearSelectedMedia());
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      const response = await deleteTimeTable(timeTableData.id).unwrap();
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
    const body = { ...data, employeeId };
    if (timeTableData && timeTableData.TimeTables) {
      try {
        const response = await updateTimeTable({
          body,
          id: timeTableData.id,
        }).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => {},
        });
      } catch (error) {
        handleError({ error, setError });
      }
    } else {
      try {
        const response = await createTimeTable(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => {},
        });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };
  return (
    <form className="" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 justify-between gap-[2.25rem] ">
        <div className="w-full space-y-[1.5rem]">
          <Input
            label={<>{translate("Heading")} 2</>}
            isRequired
            {...register("heading")}
            error={errors?.heading?.message}
          />
          <Input
            label="Sub Heading"
            isRequired
            {...register("sub_heading")}
            error={errors?.sub_heading?.message}
          />
        </div>
        <div className=" w-[508px] space-y-[1rem]">
          <div className="flex flex-col items-start">
            <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
              {translate("Upload Media")} 1{" "}
              <span className="text-red-500">*</span>
            </label>
            <MediaComponent
              title={<ImageInputUI type="large" image={img_one} />}
              handleConfirmImage={() => handleConfirmImage("img_one")}
              open={isImageOneOpen}
              setOpen={setIsImageOneOpen}
            />
          </div>
          <div className="flex flex-col items-start w-[508px]">
            <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
              {translate("Upload Media")} 2{" "}
              <span className="text-red-500">*</span>
            </label>
            <MediaComponent
              title={<ImageInputUI type="large" image={img_two} />}
              handleConfirmImage={() => handleConfirmImage("img_two")}
              open={isImageTwoOpen}
              setOpen={setIsImageTwoOpen}
            />
          </div>
        </div>
      </div>
      {/* For time table */}
      <div className="mt-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:flex gap-4 items-center"
          >
            <Input
              label="Time"
              type="text"
              isRequired
              {...register(`timeTable.${index}.date`, {
                required: "Time is required",
                pattern: {
                  value: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
                  message: "Time must be in the format HH:mm:ss",
                },
              })}
              error={errors?.timeTable?.[index]?.date?.message}
            />
            <Input
              label="Title"
              isRequired
              {...register(`timeTable.${index}.title` as const)}
              error={errors?.timeTable?.[index]?.title?.message}
            />
            <Input
              label="Caption"
              isRequired
              {...register(`timeTable.${index}.description` as const)}
              error={errors?.timeTable?.[index]?.description?.message}
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-500"
            >
              <TbTrashXFilled
                size={22}
                className="text-[#ff3c5f] mt-[1rem] cursor-pointer"
              />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            append({
              title: "",
              description: "",
              date: "",
            })
          }
          className="mt-[1rem] text-[#374451] flex items-center justify-end w-full"
        >
          <div className="flex items-center gap-[0.5rem] border-b p-[6px] border-[#374451]">
            <FaPlusSquare />
            {translate("Add your respective time")}
          </div>
        </button>
      </div>
      <div className="absolute bottom-[-5rem] right-[0rem] flex justify-end w-[920px] gap-[1rem]">
        <button type="submit" className={`submit-button `}>
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
