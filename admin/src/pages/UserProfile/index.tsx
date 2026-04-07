import { useState } from "react";
import { IoMdInformationCircle } from "react-icons/io";
import { FaServer } from "react-icons/fa";
import BasicInfo from "./BasicInfo";
import AccountManagement from "./AccountManagement";
import useTranslation from "@/locale/useTranslation";

export default function UserProfile() {
  const translate = useTranslation();
  const [tabSection, setTabSection] = useState<string>("BasicInfo");
  return (
    <div>
      <div className="bg-white mt-[3rem] shadow-lg rounded-[1.5rem] flex flex-col md:flex-row gap-[3rem] pt-[3rem] pb-[1.5rem] px-[1rem] md:px-[3rem]">
        {/* left section */}
        <div className="md:w-[30%] flex gap-[1rem] md:flex-col md:space-y-[1rem] overflow-x-auto scrollbar-hide md:overflow-x-none">
          <button
            className={`flex gap-[1rem] h-fit rounded-[0.25rem] border py-[1rem] md:py-[3rem] pl-[1rem] lg:pl-[3rem] cursor-pointer ${
              tabSection === "BasicInfo" ? "border-primaryColor" : ""
            }`}
            onClick={() => setTabSection("BasicInfo")}
          >
            <IoMdInformationCircle className="text-primaryColor h-[2rem] w-[2rem]" />
            <div>
              <h3 className="font-[500] text-[13px] leading-[1rem] whitespace-nowrap">
                {translate("Basic Information")}
              </h3>
              <p className="font-[500] text-[13px] whitespace-nowrap">
                {translate("Fundamentals")}
              </p>
            </div>
          </button>
          <button
            className={`flex gap-[1rem] h-fit rounded-[0.25rem] border py-[1rem] px-[1rem] md:py-[3rem] pl-[1rem] lg:pl-[3rem] cursor-pointer ${
              tabSection === "AccountManagement" ? "border-primaryColor" : ""
            }`}
            onClick={() => setTabSection("AccountManagement")}
          >
            <FaServer className="text-primaryColor h-[2rem] w-[2rem]" />
            <div>
              <h3 className="font-[500] text-[13px] leading-[1rem] whitespace-nowrap">
                {translate("Account Management")}
              </h3>
              <p className="font-[500] text-[13px] whitespace-nowrap">
                {translate("Change Password")}
              </p>
            </div>
          </button>
        </div>
        {/* right section */}
        <div className="w-full md:w-[70%]">
          {tabSection === "BasicInfo" && <BasicInfo />}
          {tabSection === "AccountManagement" && <AccountManagement />}
        </div>
      </div>
    </div>
  );
}
