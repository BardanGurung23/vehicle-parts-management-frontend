import Button from "@/components/Button";
import ImageInputUIComponent from "@/components/ImageInputUIComponent";
import Input from "@/components/Input";
import MediaComponent from "@/components/MediaComponent";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import {
  useCreateTestimonialMutation,
  useGetTestimonialByIdQuery,
  useUpdateTestimonialByIdMutation,
} from "@/redux/services/testimonial";
import { useAppSelector } from "@/redux/store/hooks";
import { TESTIMONIAL_LIST_ROUTE } from "@/routes/routeNames";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PageTitle from "@/components/PageTitle";

// Define the Zod schema for the testimonial form
const TestimonialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  designation: z.string().min(1, "Designation is required"),
  description: z.string().min(1, "Message is required"),
  image: z.string().min(1, "Icon image is required"),
});

type TestimonialFormData = z.infer<typeof TestimonialFormSchema>;

export default function AddEditTestimonial() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    setError,
    formState: { isValid, isSubmitting, errors },
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(TestimonialFormSchema), // Integrate Zod schema
    defaultValues: {
      name: "",
      designation: "",
      description: "",
      image: "",
    },
  });

  const selectedImage = useAppSelector((state) => state.media.selectedImage);
  const [isImg, setIsImg] = useState<boolean>(false);
  const [portfolioOptions, setPortfolioOptions] = useState<
    { label: string; value: number }[]
  >([]);

  const image = getValues("image");

  const { data: testimonialDetails, isSuccess: success } =
    useGetTestimonialByIdQuery(id, { skip: id === null || id === undefined });

  const [createTestimonial] = useCreateTestimonialMutation();
  const [updateTestimonial] = useUpdateTestimonialByIdMutation();

  useEffect(() => {
    if (success && testimonialDetails?.data) {
      reset({ ...testimonialDetails?.data });
    }
  }, [testimonialDetails, success, reset]);

  const handleConfirmImage = (field: string) => {
    if (field === "image") {
      setValue("image", selectedImage, { shouldValidate: true });
      setIsImg(false);
    }
  };

  const onSubmit = async (data: TestimonialFormData) => {
    if (id) {
      // Edit mode
      try {
        const body = { ...data };
        const response = await updateTestimonial({ body, id }).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => navigate(TESTIMONIAL_LIST_ROUTE),
        });
      } catch (error) {
        handleError({ error, setError });
      }
    } else {
      // Create mode
      try {
        const response = await createTestimonial(data).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => navigate(TESTIMONIAL_LIST_ROUTE),
        });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };

  return (
    <>
      <PageTitle title="Testimonial" isBack />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative grid grid-cols-1 md:grid-cols-2 gap-[2rem] w-full border pl-[1.5rem] pt-[1.5rem] pb-[3rem] pr-[4.5rem] mt-[3rem]"
      >
        <div className="absolute top-[-0.7rem] left-[43px] px-[1rem] z-20 bg-[#FAF7FA]"></div>
        <Input
          label="Name"
          isRequired
          {...register("name")}
          error={errors?.name?.message} // Display validation error
        />
        <Input
          label="Designation"
          isRequired
          {...register("designation")}
          error={errors?.designation?.message} // Display validation error
        />
        <TextArea
          label="Message"
          {...register("description")}
          error={errors?.description?.message} // Display validation error
        />
        <div className="flex flex-col items-start">
          <label className="font-[400] input-label text-[0.75rem] text-start mb-[2px] text-[#626c78]">
            {"Icon Image"} <span className="text-red-500">*</span>
          </label>
          <MediaComponent
            title={<ImageInputUIComponent type="large" image={image} />}
            handleConfirmImage={() => handleConfirmImage("image")}
            open={isImg}
            setOpen={setIsImg}
            isMultiSelect={false}
          />
          {errors?.image && (
            <span className="text-red-500 text-sm">{errors.image.message}</span>
          )}
        </div>
        <br />
        <div className="flex">
          <Button
            type="submit"
            className="submit-button w-[5rem]"
            disabled={isSubmitting || !isValid} // Disable button if form is invalid or submitting
          >
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              {"Submit"}
            </div>
          </Button>
        </div>
      </form>
    </>
  );
}
