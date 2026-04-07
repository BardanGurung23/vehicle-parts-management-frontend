import Input from "@/components/Input";
import PageTitle from "@/components/PageTitle";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { BannerSchema } from "./schema";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetApiQuery, useUpdateApiMutation } from "@/redux/services/crudApi";
import Button from "@/components/Button";
import { useSingleImageHandler } from "@/hooks/useImageHandler";
import MediaComponent from "@/components/MediaComponent";
import { ImageInputUI, VideoInputUI } from "@/components/ImageComponent";
import TextArea from "@/components/TextArea";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { BANNER_URL } from "@/constants/apiUrlConstants";
import { useEffect } from "react";
import { BANNER_LIST_ROUTE } from "@/routes/routeNames";

type BannerFormType = z.infer<typeof BannerSchema>;

export default function AddEditBanner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const isHomeBanner = id === "home-banner";

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormType>({
    resolver: zodResolver(BannerSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bannerItems",
  });

  const [updateBanner, { isLoading: updatingBanner }] = useUpdateApiMutation();
  const {
    data: bannerData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${BANNER_URL}${id}` },
    {
      skip: !isEditMode,
    },
  );

  useEffect(() => {
    if (bannerData && bannerData?.data) {
      reset(bannerData?.data);
    }
  }, [bannerData]);

  const handleAddNewButton = (event: React.FormEvent) => {
    event.preventDefault();
    append({ image: "", caption: "", subTitle: "", title: "" });
  };

  const onSubmit = async (data: BannerFormType) => {
    const body = { ...data };
    try {
      const response = await updateBanner({
        url: `${BANNER_URL}${bannerData?.data?.id}`,
        body,
      }).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => {
          navigate(BANNER_LIST_ROUTE);
        },
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  // video component hook
  // const {
  //   imageUrl: videoUrl,
  //   handleConfirmImage: handleConfirmVideo,
  //   isImageModelOpen: isVideoModelOpen,
  //   setIsImageModelOpen: setVideoModelOpen,
  // } = useSingleImageHandler(setValue, getValues, "video_url");

  return (
    <>
      <PageTitle isBack title={id ? "Edit Banner" : "Add Banner"} />
      <form className="form-container" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Banner Name"
          {...register("name")}
          className={`w-1/2`}
          disabled={true}
          error={errors?.name?.message}
        />

        {/* video component */}

        {/* {isHomeBanner && (
          <div className="relative flex flex-col items-start w-[20rem] mt-[2rem] ">
            <label className="input-label">Banner Video </label>

            <div className="flex flex-col gap-3">
              <div className="relative flex flex-col items-start">
                <MediaComponent
                  title={<VideoInputUI video={videoUrl} />}
                  isMultiSelect={false}
                  handleConfirmImage={() => handleConfirmVideo("video_url")}
                  open={isVideoModelOpen}
                  setOpen={setVideoModelOpen}
                  acceptFiles="video/mp4,video/webm,video/ogg"
                />
                {videoUrl && (
                  <button
                    type="button"
                    className="text-red-500 border border-red-500 py-0 px-[.4rem]"
                    onClick={() => {
                      setValue("video_url", null, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    Remove Video
                  </button>
                )}
              </div>
            </div>

            {errors?.video_url?.message && (
              <p className="text-red-500 text-sm">{errors.video_url.message}</p>
            )}
          </div>
        )} */}

        <div className="floating-style-container">
          <div className="floating-input-container">
            <p className="input-title">Add Slides</p>
            <button
              type="button"
              className="text-primaryColor"
              onClick={(event) => handleAddNewButton(event)}
            >
              Add Slides
            </button>
          </div>
          <div className="py-[1rem] px-[2rem]">
            {fields.map((field, index) => (
              <SlidesInputComponent
                getValues={getValues}
                setValue={setValue}
                key={field.id}
                title={`${index + 1}. Slide ${index + 1}`}
                index={index}
                remove={remove}
                control={control}
                errors={errors}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-start">
          <Button type="submit" className="submit-button w-[5rem]">
            {" "}
            <div className="flex justify-center items-center gap-[0.5rem] text-white ">
              Submit
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}

function SlidesInputComponent({
  getValues,
  setValue,
  title,
  index,
  remove,
  control,
  errors,
}) {
  const {
    imageUrl,
    handleConfirmImage,
    isImageModelOpen,
    setIsImageModelOpen,
  } = useSingleImageHandler(setValue, getValues, `bannerItems.${index}.image`);

  const handleRemoveButton = (event: React.FormEvent) => {
    event.preventDefault();
    remove(index);
  };

  return (
    <div className="floating-style-container">
      <div className="floating-input-container">
        <p className="input-title">{title}</p>
        <button
          type="button"
          className="text-red-500"
          onClick={handleRemoveButton}
        >
          Remove
        </button>
      </div>
      <div className="py-[1rem] gap-4 px-[2rem] grid grid-cols-1 md:grid-cols-2">
        <div className="space-y-[1rem]">
          <div className="relative flex flex-col items-start w-[20rem] ">
            <label className="input-label">
              Image <span className="text-red-500">*</span>
            </label>
            <MediaComponent
              title={<ImageInputUI image={imageUrl} />}
              isMultiSelect={false}
              handleConfirmImage={() =>
                handleConfirmImage(`bannerItems.${index}.image`)
              }
              open={isImageModelOpen}
              setOpen={setIsImageModelOpen}
            />
          </div>
        </div>
        <div className="space-y-[1rem]">
          <Controller
            name={`bannerItems.${index}.title`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Title"
                // placeholder="Enter title"
                error={errors.bannerItems?.[index]?.title?.message}
              />
            )}
          />
          <Controller
            name={`bannerItems.${index}.subTitle`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Sub Title"
                // placeholder="Enter sub Title"
                error={errors.bannerItems?.[index]?.subTitle?.message}
              />
            )}
          />
          <Controller
            name={`bannerItems.${index}.caption`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Caption"
                // className="w-full md:w-1/2"
                placeholder="Enter Caption"
                error={errors.bannerItems?.[index]?.caption?.message}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
