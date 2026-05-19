import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronsRight } from "lucide-react";
import { LogoutIcon, ProfileIcon, CarIcon } from "../../icons.tsx";

interface NavPopUpProps {
  user?: {
    imageUrl?: string;
    username?: string;
    email?: string;
    fullName?: string;
  };
  handleLogout?: () => void;
  sideMenuOpen?: boolean;
}

export const NavPopUp = ({
  user,
  handleLogout,
  sideMenuOpen,
  isSidebarCollapsed,
  initials,
  role,
  logout,
}: NavPopUpProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={`${isSidebarCollapsed ? "ml-auto" : "ml-0"} border border-[#323332] rounded-sm hover:bg-hoverBg  p-1 cursor-pointer `}
        >
          <ChevronsRight size={20} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        alignOffset={isSidebarCollapsed ? -120 : 20}
        sideOffset={isSidebarCollapsed ? 20 : 20}
        side="right"
        className="p-[15px] max-w-[300px] border-[#262626] bg-black"
      >
        <section>
          <div className="flex gap-[1rem] pb-[15px] border-b border-[#262626] items-center">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-primary-on-container shrink-0 shadow-level1">
              {initials}
            </div>
            <div className="flex flex-col items-start justify-between py-2">
              <div className="flex flex-col ">
                <p className="font-semibold text-sm text-textColor">
                  {user?.fullName}
                </p>
              </div>
              <p className="text-[10px] text-textColor font-medium line-clamp-1">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="py-[0.5rem] flex flex-col ">
            {/* Profile */}
            <a
              href="/app/profile"
              className="flex items-center gap-2 px-2 py-2 hover:bg-[#242323] rounded-md text-white"
            >
              <ProfileIcon className="size-[16px] text-white" />
              <span className="text-sm">My Profile</span>
            </a>
            <a
              href="/app/profile/vehicles"
              className="flex items-center gap-2 px-2 py-2 hover:bg-[#242323] rounded-md text-white"
            >
              <CarIcon className="size-[16px] text-white" />
              <span className="text-sm">My Vehicle</span>
            </a>
          </div>
          <div className="pt-1 border-t border-[#ebe9f1] ">
            <div
              onClick={logout}
              className="text-sm text-red-500 flex gap-2 items-center hover:bg-[#242323] rounded-md px-2 py-2 w-full"
            >
              <LogoutIcon className="size-[16px]" />
              Log Out
            </div>
          </div>
        </section>
      </PopoverContent>
    </Popover>
  );
};
