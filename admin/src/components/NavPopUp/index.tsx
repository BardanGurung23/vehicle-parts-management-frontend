import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronsRight } from "lucide-react";
import { LogoutIcon, ProfileIcon, CarIcon } from "../../icons.tsx";

/**
 * NavPopUp — legacy account popup used by older shells.
 *
 * Note: the redesigned AppLayout has its own integrated user menu in the top
 * bar, so this component is no longer used by the admin shell. It is kept
 * here for any feature page that imports it directly. All styling has been
 * updated to use the new admin design tokens.
 */
interface NavPopUpProps {
  user?: {
    imageUrl?: string;
    username?: string;
    email?: string;
    fullName?: string;
  };
  handleLogout?: () => void;
  sideMenuOpen?: boolean;
  isSidebarCollapsed?: boolean;
  initials?: string;
  role?: string;
  logout?: () => void;
}

export const NavPopUp = ({
  user,
  isSidebarCollapsed,
  initials,
  logout,
}: NavPopUpProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className={`${isSidebarCollapsed ? "ml-auto" : "ml-0"} border border-neutral-200 rounded-md hover:bg-neutral-100 p-1 transition-colors`}
        >
          <ChevronsRight size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        alignOffset={isSidebarCollapsed ? -120 : 20}
        sideOffset={20}
        side="right"
        className="p-2 w-72"
      >
        <section>
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-200">
            <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-neutral-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="py-1 flex flex-col">
            <a
              href="/app/profile"
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <ProfileIcon className="size-4 text-neutral-500" />
              My Profile
            </a>
            <a
              href="/app/profile/vehicles"
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <CarIcon className="size-4 text-neutral-500" />
              My Vehicles
            </a>
          </div>
          <div className="pt-1 border-t border-neutral-200">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 px-2 py-2 rounded-md text-sm text-danger-700 hover:bg-danger-50"
            >
              <LogoutIcon className="size-4" />
              Sign out
            </button>
          </div>
        </section>
      </PopoverContent>
    </Popover>
  );
};
