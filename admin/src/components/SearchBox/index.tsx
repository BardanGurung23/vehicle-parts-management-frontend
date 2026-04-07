import { FRONTEND_BASE_URL } from "@/constants";
import { SideMenuList } from "../../layout/sideMenuList";
import { useState } from "react";
import { MdOutlineSearch } from "react-icons/md";
import { useNavigate } from "react-router-dom";

type RouteSuggestionType = {
  name: string;
  path?: string;
};

export default function SearchBox() {
  const navigate = useNavigate();

  const [userInput, setUserInput] = useState<string>("");

  const [suggestion, setSuggestion] = useState<RouteSuggestionType[]>([]);

  const handleSearchOptionClick = (path: string) => {
    navigate(path);
    setUserInput("");
    setSuggestion([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (value.trim() !== "") {
      const matchedRoutes: RouteSuggestionType[] = SideMenuList.filter(
        (route) => route.name.toLowerCase().includes(value),
      ).flatMap((route) => {
        if (!route.menu) {
          return { name: route.name, path: route.path };
        } else {
          return route.menu.map((each) => {
            return { name: each.name, path: each.path };
          });
        }
      });
      setSuggestion(matchedRoutes);
    } else {
      setSuggestion([]);
    }
  };

  return (
    <div className="relative text-[#444050] flex items-center pl-[13px] ">
      <MdOutlineSearch size={18} className="mr-[1rem]" />
      <input
        type="text"
        placeholder="Search Ctrl + k"
        value={userInput}
        onChange={handleInputChange}
        className="flex-1 font-[400] text-[1rem] text-[#ACAAB1] outline-none bg-transparent placeholder-[#ACAAB1]"
      />
      {suggestion.length > 0 && (
        <ul className="absolute bg-white shadow-xl top-[1rem] mt-[1rem] px-[1rem] space-y-[1rem] py-[1.5rem]">
          {suggestion.map((each, index) => (
            <div
              key={index}
              className="cursor-pointer p-[0.5rem] hover:text-white hover:bg-gradient-to-r hover:from-[#0190dd] hover:to-[#80c7ee]"
              onClick={() =>
                handleSearchOptionClick(each.path ? each.path : "")
              }
            >
              <div>{each.name}</div>
              <div>{`${FRONTEND_BASE_URL}${each.path}`}</div>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
