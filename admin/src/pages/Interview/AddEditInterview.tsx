import { useEffect, useState } from "react";
import { BiUser } from "react-icons/bi";
import { FaClipboardList } from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { useParams } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import { useForm } from "react-hook-form";
import Message from "./Message";
import { BasicFormSchema, InterviewSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InterviewQuestion from "./InterviewQuestion";
import { useGetInterviewByIdQuery } from "@/redux/services/interview";
import useTranslation from "@/locale/useTranslation";
import moment from "moment";

export type TabOptions = "BasicInfo" | "Message" | "Interview";

export type InterviewFormType = z.infer<typeof InterviewSchema>;

type BasicFormSchemaType = keyof typeof BasicFormSchema.shape;

export default function AddEditInterview() {
  const translate = useTranslation();
  const { id } = useParams();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    setError,
    formState: { errors },
  } = useForm<InterviewFormType>({
    resolver: zodResolver(InterviewSchema),
    defaultValues: {
      departmentId: "",
    },
  });

  const [hasBasicInfoErrors, setHasBasicInfoErrors] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabOptions>("BasicInfo");
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const [qnaData, setQnaData] = useState();
  const [timeTableData, setTimeTableData] = useState();

  const { data: interviewDetails, isSuccess: success } =
    useGetInterviewByIdQuery(id, { skip: id === null || id === undefined });

  useEffect(() => {
    if (id && interviewDetails?.data) {
      reset({
        ...interviewDetails?.data,
        entered_date: moment(interviewDetails?.data.entered_date).format(
          "YYYY",
        ),
      });

      setEmployeeId(interviewDetails?.data?.id);
      setQnaData(interviewDetails?.data?.qna);
      setTimeTableData(interviewDetails?.data?.timeTableHeader);
    } else {
      reset();
    }
  }, [id, interviewDetails, reset, success]);

  const handleTabChange = (tab: TabOptions) => {
    setCurrentTab(tab);
  };

  useEffect(() => {
    const basicInfoFields = Object.keys(
      BasicFormSchema.shape,
    ) as BasicFormSchemaType[];

    setHasBasicInfoErrors(basicInfoFields.some((field) => errors[field]));
  }, [errors]);

  return (
    <div className="mt-[3rem]">
      {/* Tab Section */}
      <div className="flex gap-[1rem]  overflow-x-auto scrollbar-hide">
        <button
          className={`flex items-center gap-[6px] border px-[20px] py-[0.5rem] rounded-[6px] whitespace-nowrap ${
            currentTab === "BasicInfo" ? "bg-[#0090DD] text-white" : ""
          }`}
          onClick={() => handleTabChange("BasicInfo")}
        >
          <BiUser size={20} /> {translate("Basic Info")}{" "}
          {hasBasicInfoErrors && "⚠️"}
        </button>
        <button
          className={`flex items-center gap-[6px] border px-[20px] py-[0.5rem] rounded-[6px] whitespace-nowrap ${
            currentTab === "Message" ? "bg-[#0090DD] text-white" : ""
          }`}
          onClick={() => handleTabChange("Message")}
        >
          <FiMail size={16} />

          {translate("Message")}
        </button>
        <button
          className={`flex items-center gap-[6px] border px-[20px] py-[0.5rem] rounded-[6px] whitespace-nowrap ${
            id === null || id === undefined
              ? "cursor-not-allowed text-gray-400"
              : "cursor-pointer"
          } ${currentTab === "Interview" ? "bg-[#0090DD] text-white" : ""}`}
          onClick={() => handleTabChange("Interview")}
          disabled={id === undefined}
        >
          <FaClipboardList size={16} />
          {translate("Interview")}
        </button>
      </div>
      {currentTab === "BasicInfo" && (
        <BasicInfo
          register={register}
          errors={errors}
          setTab={setCurrentTab}
          setValue={setValue}
          getValues={getValues}
          control={control}
        />
      )}
      {currentTab === "Message" && (
        <Message
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          getValues={getValues}
          setValue={setValue}
          setEmployeeId={setEmployeeId}
          setError={setError}
        />
      )}
      {currentTab === "Interview" && (
        <InterviewQuestion
          employeeId={employeeId}
          qnaData={qnaData}
          timeTableData={timeTableData}
        />
      )}
    </div>
  );
}
