import { useState } from "react";
import { TbUserQuestion } from "react-icons/tb";
import Questionnaire from "./Questionnare";
import TimeTableQuestionnaire from "./TimeTableQuestionnare";
import useTranslation from "@/locale/useTranslation";

export default function InterviewQuestion({
  employeeId,
  qnaData,
  timeTableData,
}: {
  employeeId: number | null;
  qnaData: any;
  timeTableData: any;
}) {
  const translate = useTranslation();
  const [questionNumber, setQuestionNumber] = useState<number>(
    qnaData.length > 3 ? qnaData.length + 1 : 4,
  );
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);

  const handleTabChange = (index: number) => {
    setCurrentQuestion(index + 1);
  };

  return (
    <div className="mt-[3rem] space-y-[3rem]">
      <div className="relative md:w-fit md:max-w-[920px] flex flex-col justify-between gap-[2.25rem] px-[1.5rem] py-[4.5rem] border border-[#C9CBD1] rounded-[0.25rem]">
        <div className="absolute top-[-0.7rem] left-[43px] px-[1rem] z-20 bg-[#FAF7FA]">
          <p className="font-[400] text-[1.25rem]">
            {translate("Questionnaire")} *
          </p>
        </div>
        <div className="flex gap-[1.5rem] md:max-w-[920px] overflow-x-auto scrollbar-hide">
          {Array.from({ length: questionNumber }).map((_, index) => (
            <button
              key={index}
              className={`flex items-center w-fit gap-[6px] border px-[20px] py-[0.5rem] rounded-[6px] whitespace-nowrap ${
                currentQuestion === index + 1 ? "bg-[#FF7F2D] text-white" : ""
              }`}
              onClick={() => handleTabChange(index)}
            >
              <TbUserQuestion size={20} /> {translate("Question")}{" "}
              <span>{index + 1}</span>
            </button>
          ))}
        </div>

        {currentQuestion !== 2 ? (
          <Questionnaire
            employeeId={employeeId}
            qnaData={qnaData.find(
              (item: { qno: number }) => item.qno === currentQuestion,
            )}
            qno={currentQuestion}
            questionNumber={questionNumber}
            setQuestionNumber={setQuestionNumber}
            setCurrentQuestion={setCurrentQuestion}
          />
        ) : (
          <TimeTableQuestionnaire
            employeeId={employeeId}
            timeTableData={timeTableData}
          />
        )}
      </div>
    </div>
  );
}
