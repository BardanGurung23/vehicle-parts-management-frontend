import Input from "@/components/Input";
import { DepartmentSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentByIdMutation,
} from "@/redux/services/department";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { z } from "zod";
import { useEffect } from "react";
import useTranslation from "@/locale/useTranslation";
import { DEPARTMENT_LIST_ROUTE } from "@/routes/routeNames";

type DepartmentFormType = z.infer<typeof DepartmentSchema>;

export default function DepartmentBasicInfo({ basicInfo }: { basicInfo: any }) {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DepartmentFormType>({ resolver: zodResolver(DepartmentSchema) });

  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentByIdMutation();

  useEffect(() => {
    if (basicInfo) {
      reset({ ...basicInfo });
    }
  }, [basicInfo]);

  const onSubmit = async (data: any) => {
    const body = { ...data, subNameOne: "one", subNameTwo: "two" };
    if (id) {
      try {
        const response = await updateDepartment({ body, id }).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => navigate(DEPARTMENT_LIST_ROUTE),
        });
      } catch (error) {
        handleError({ error, setError });
      }
    } else {
      try {
        const response = await createDepartment(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => navigate(DEPARTMENT_LIST_ROUTE),
        });
      } catch (error) {
        handleError({ error, setError });
      }
    }
  };
  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-[1rem] mt-[3rem]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Input
        label="Name"
        placeholder="Enter Department Name"
        {...register("name")}
        error={errors.name?.message}
      />

      <div className="flex flex-col items-start gap-[0.25rem]">
        <label className="text-[#374561] font-[400] text-[0.75rem]">
          {translate("Department Color")}
        </label>
        <div>
          <input type="color" className="" {...register("color")} />
        </div>
      </div>

      <div />
      <div className="flex justify-end">
        <Button type="submit" className="submit-button w-[5rem]">
          {" "}
          <div className="flex justify-center items-center gap-[0.5rem] text-white ">
            {translate("Submit")}
          </div>
        </Button>
      </div>
    </form>
  );
}
