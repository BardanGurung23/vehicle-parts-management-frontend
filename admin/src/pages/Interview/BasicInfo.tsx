import MediaComponent from "@/components/MediaComponent";
import Input from "@/components/Input";
import { useEffect, useState } from "react";
import { Control, Controller, FieldErrors, useForm } from "react-hook-form";
import { InterviewFormType, TabOptions } from "./AddEditInterview";
import { useDispatch } from "react-redux";
import { clearSelectedMedia } from "@/redux/feature/mediaSlice";
import { useAppSelector } from "@/redux/store/hooks";
import { IMAGE_BASE_URL } from "@/constants";
import { useListAllDepartmentsQuery } from "@/redux/services/department";
import Select from "@/components/Select";
import useTranslation from "@/locale/useTranslation";
import galleryIcon from "@/assets/gallery_icon.svg";

type BasicInfoProps = {
  register: ReturnType<typeof useForm<InterviewFormType>>["register"];
  errors: FieldErrors<InterviewFormType>;
  setTab: React.Dispatch<React.SetStateAction<TabOptions>>;
  setValue: ReturnType<typeof useForm<InterviewFormType>>["setValue"];
  getValues: ReturnType<typeof useForm<InterviewFormType>>["getValues"];
  control: Control<InterviewFormType>;
};

export default function BasicInfo({
  register,
  errors,
  setTab,
  setValue,
  getValues,
  control,
}: Readonly<BasicInfoProps>) {
  const translate = useTranslation();
  const dispatch = useDispatch();

  //   state for the image pop up
  const [isWebViewOpen, setIsWebViewOpen] = useState<boolean>(false);
  const [isMobileViewOpen, setIsMobileViewOpen] = useState<boolean>(false);
  const [isEmployeeCarouselOpen, setIsEmployeeCarouselOpen] =
    useState<boolean>(false);
  const [isQuoteImageOneViewOpen, setIsQuoteImageOneViewOpen] =
    useState<boolean>(false);
  const [isQuoteImageTwoViewOpen, setIsQuoteImageTwoViewOpen] =
    useState<boolean>(false);
  const [isRoundImageOpen, setIsRoundImageOpen] = useState<boolean>(false);
  const [isEmpCarouselHoverImageOpen, setIsEmpCarouselHoverImageOpen] =
    useState<boolean>(false);
  const [isWorkStyleInterviewImageOpen, setIsWorkStyleInterviewImageOpen] =
    useState<boolean>(false);

  const [departmentOptions, setDepartmentOptions] = useState<
    { label: string; value: number }[]
  >([]);

  // api calls
  const { data: allDepartment, isSuccess: getDepartmentSuccess } =
    useListAllDepartmentsQuery({ page: 1, limit: 100 });

  useEffect(() => {
    if (getDepartmentSuccess && allDepartment?.data?.data) {
      const options = allDepartment?.data?.data.map(
        (each: { name: string; id: number }) => ({
          label: each.name,
          value: Number(each.id),
        }),
      );
      setDepartmentOptions(options);
    }
  }, [getDepartmentSuccess, allDepartment]);

  // getting the images
  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const web_view_img = getValues("web_view_img");
  const mobile_view_img = getValues("mobile_view_img");
  const emp_carousel_img = getValues("emp_carousel_img");
  const emp_quote_img_one = getValues("emp_quote_img_one");
  const emp_quote_img_two = getValues("emp_quote_img_two");
  const round_img = getValues("round_img");
  const emp_carousel_hov_img = getValues("emp_carousel_hov_img");
  const work_style_interview_image = getValues("work_style_interview_image");

  const handleConfirmImage = (field: string) => {
    switch (field) {
      case "web_view_img":
        setValue("web_view_img", selectedImage);
        setIsWebViewOpen(false);
        break;
      case "mobile_view_img":
        setValue("mobile_view_img", selectedImage);
        setIsMobileViewOpen(false);
        break;
      case "emp_carousel_img":
        setValue("emp_carousel_img", selectedImage);
        setIsEmployeeCarouselOpen(false);
        break;
      case "emp_quote_img_one":
        setValue("emp_quote_img_one", selectedImage);
        setIsQuoteImageOneViewOpen(false);
        break;
      case "emp_quote_img_two":
        setValue("emp_quote_img_two", selectedImage);
        setIsQuoteImageTwoViewOpen(false);
        break;
      case "round_img":
        setValue("round_img", selectedImage);
        setIsRoundImageOpen(false);
        break;
      case "emp_carousel_hov_img":
        setValue("emp_carousel_hov_img", selectedImage);
        setIsEmpCarouselHoverImageOpen(false);
        break;
      case "work_style_interview_image":
        setValue("work_style_interview_image", selectedImage);
        setIsWorkStyleInterviewImageOpen(false);
        break;
      default:
        break;
    }
    dispatch(clearSelectedMedia());
  };

  return (
    <>
      <form className="relative grid grid-cols-1 md:grid-cols-2 gap-[2rem] w-full md:w-[744px] border pl-[1.5rem] pt-[1.5rem] pb-[3rem] pr-[4.5rem] mt-[3rem]">
        <div className="absolute top-[-0.7rem] left-[43px] px-[1rem] z-20 bg-[#FAF7FA]">
          <p className="font-[400] text-[1.25rem]">
            {translate("Basic Info")} *
          </p>
        </div>
        <Input
          label="Initials"
          isRequired
          {...register("initials")}
          error={errors?.initials?.message}
        />
        <Input
          label="Slug"
          isRequired
          {...register("slug")}
          error={errors?.slug?.message}
        />
        <Controller
          name="departmentId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label={
                <p>
                  {translate("Department")}{" "}
                  <span className="text-red-500">*</span>
                </p>
              }
              options={departmentOptions}
              error={errors?.departmentId?.message}
            />
          )}
        />
        <Input
          label="Sub Department"
          isRequired
          {...register("subDepartment")}
          error={errors?.subDepartment?.message}
        />
        <Input
          label="Office Location"
          isRequired
          {...register("office_location")}
          error={errors?.office_location?.message}
        />
        <Input
          label="Date entered in the company"
          isRequired
          {...register("entered_date")}
          error={errors?.entered_date?.message}
        />
        <Input
          label="Designation"
          isRequired
          {...register("designation")}
          error={errors?.designation?.message}
        />
        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Employee Words")}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-between w-full">
            <MediaComponent
              title={<ImageInputUI type="small" image={emp_quote_img_one} />}
              handleConfirmImage={() => handleConfirmImage("emp_quote_img_one")}
              open={isQuoteImageOneViewOpen}
              setOpen={setIsQuoteImageOneViewOpen}
            />
            <MediaComponent
              title={<ImageInputUI type="small" image={emp_quote_img_two} />}
              handleConfirmImage={() => handleConfirmImage("emp_quote_img_two")}
              open={isQuoteImageTwoViewOpen}
              setOpen={setIsQuoteImageTwoViewOpen}
            />
          </div>
        </div>
        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Employee Banner Image (Web View)")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUI type="large" image={web_view_img} />}
            handleConfirmImage={() => handleConfirmImage("web_view_img")}
            open={isWebViewOpen}
            setOpen={setIsWebViewOpen}
          />
        </div>
        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Employee Banner Image (Mobile View)")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUI type="large" image={mobile_view_img} />}
            handleConfirmImage={() => handleConfirmImage("mobile_view_img")}
            open={isMobileViewOpen}
            setOpen={setIsMobileViewOpen}
          />
        </div>

        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Employee Work style Interview Image")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={
              <ImageInputUI type="large" image={work_style_interview_image} />
            }
            handleConfirmImage={() =>
              handleConfirmImage("work_style_interview_image")
            }
            open={isWorkStyleInterviewImageOpen}
            setOpen={setIsWorkStyleInterviewImageOpen}
          />
        </div>

        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Employee Carousel Image")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUI type="large" image={emp_carousel_img} />}
            handleConfirmImage={() => handleConfirmImage("emp_carousel_img")}
            open={isEmployeeCarouselOpen}
            setOpen={setIsEmployeeCarouselOpen}
          />
        </div>
        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Sticker Image")} <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUI type="large" image={round_img} />}
            handleConfirmImage={() => handleConfirmImage("round_img")}
            open={isRoundImageOpen}
            setOpen={setIsRoundImageOpen}
          />
        </div>
        <div className="flex flex-col items-start">
          <label className="font-[400] text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {translate("Employee Carousel Hover Image")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUI type="large" image={emp_carousel_hov_img} />}
            handleConfirmImage={() =>
              handleConfirmImage("emp_carousel_hov_img")
            }
            open={isEmpCarouselHoverImageOpen}
            setOpen={setIsEmpCarouselHoverImageOpen}
          />
        </div>
        <br />
      </form>
      <div className="flex justify-end w-full md:w-[744px] gap-[1rem] mt-[3rem]">
        <button
          className="submit-button text-white"
          onClick={() => setTab("Message")}
        >
          {translate("Continue")}
        </button>
        <button
          className="px-[20px] py-[8px] bg-slate-400 rounded-[6px]"
          onClick={() => setTab("BasicInfo")}
        >
          {translate("Discard")}
        </button>
      </div>
    </>
  );
}

const ImageInputUI = ({ type, image }: { type: string; image?: string }) => {
  const translate = useTranslation();
  return (
    <>
      <div
        className={`h-[60px] border border-[#C9CBD1] rounded-[6px] flex items-center justify-center ${type === "small" ? "w-[147px] " : "w-[307px]"}`}
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
