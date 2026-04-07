import { useForm } from "react-hook-form";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { z } from "zod";
import { SecuritySchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChangePasswordMutation } from "@/redux/services/authentication";
import { handleError, handleResponse } from "@/utils/responseHandler";
import useTranslation from "@/locale/useTranslation";
import { trimFormData } from "@/utils/validationHelper";

type AccountManagementFormType = z.infer<typeof SecuritySchema>;

export default function AccountManagement() {
  const translate = useTranslation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AccountManagementFormType>({
    resolver: zodResolver(SecuritySchema),
  });

  const [changePassword] = useChangePasswordMutation();

  const onSubmit = async (data: any) => {
    const trimmedData = trimFormData(data);
    const body = { ...trimmedData };
    delete body.confirmPassword;
    try {
      const response = await changePassword(body).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <div className="flex flex-col ">
      <h3 className="font-[600] text-[1.5rem] text-primaryColor self-start">
        {translate("Account Management")}
      </h3>
      <form
        className="space-y-[2rem] mt-[3rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="New Password"
          placeholder="******"
          className="w-full md:w-1/2"
          {...register("newPassword")}
          error={errors?.newPassword?.message}
        />
        <Input
          label="Confirm Password"
          placeholder="******"
          className="w-full md:w-1/2"
          {...register("confirmPassword")}
          error={errors?.confirmPassword?.message}
        />
        <Button type="submit" className="submit-button flex justify-start">
          <p className="text-white">{translate("Change Password")}</p>
        </Button>
      </form>
    </div>
  );
}
