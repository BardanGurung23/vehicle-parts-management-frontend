import { useLocation, useParams } from "react-router-dom";
import { BiUser } from "react-icons/bi";
import { FaClipboardList } from "react-icons/fa";
import { useEffect, useState } from "react";
import DepartmentBasicInfo from "./DepartmentBasicInfo";
import DepartmentCliparts from "./DepartmentCliparts";
import { useGetDepartmentByIdQuery } from "@/redux/services/department";
import useTranslation from "@/locale/useTranslation";

type TabOptions = "BasicInfo" | "ClipArts";

export default function AddEditDepartment() {
  const translate = useTranslation();
  const { id } = useParams();
  // for breadcrumbs
  const location = useLocation();
  const path = location.pathname.split("/").slice(1, -1);

  //   for tab
  const [currentTab, setCurrentTab] = useState<TabOptions>("BasicInfo");

  const [basicInfo, setBasicInfo] = useState();
  const [cliparts, setCliparts] = useState();

  const handleTabChange = (tab: TabOptions) => {
    setCurrentTab(tab);
  };

  const { data: departmentInfo, isSuccess: success } =
    useGetDepartmentByIdQuery(id, {
      skip: id === null || id === undefined,
    });

  useEffect(() => {
    if (success && departmentInfo?.data) {
      setBasicInfo(departmentInfo?.data);
      setCliparts(departmentInfo?.data?.ClipArts);
    }
  }, [departmentInfo, success]);

  return (
    <div className="mt-[3rem]">
      {/* Breadcrumbs */}
      <div className="flex gap-[0.25rem]">
        {path.map((each, index) => (
          <div key={index} className="capitalize">
            {each} &gt;
          </div>
        ))}
        <p>Basic Info</p>
      </div>
      {/* Tab Section */}
      <div className="flex gap-[1rem] mt-[2.25rem]">
        <button
          className={`flex items-center gap-[6px] border px-[20px] py-[0.5rem] rounded-[6px] ${
            currentTab === "BasicInfo" ? "bg-[#0090DD] text-white" : ""
          }`}
          onClick={() => handleTabChange("BasicInfo")}
        >
          <BiUser size={20} /> {translate("Basic Info")}
        </button>
        <button
          className={`flex items-center gap-[6px] border px-[20px] py-[0.5rem] rounded-[6px] ${
            currentTab === "ClipArts" ? "bg-[#0090DD] text-white" : ""
          } ${!id ? "cursor-not-allowed text-gray-400" : ""}`}
          disabled={!id}
          onClick={() => handleTabChange("ClipArts")}
        >
          <FaClipboardList size={16} />
          {translate("Clip Arts")}
        </button>
      </div>
      {/* tab value section */}
      {currentTab === "BasicInfo" && (
        <DepartmentBasicInfo basicInfo={basicInfo} />
      )}
      {currentTab === "ClipArts" && <DepartmentCliparts cliparts={cliparts} />}
    </div>
  );
}
