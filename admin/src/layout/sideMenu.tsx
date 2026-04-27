import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SideMenuList, SideListMenuType } from "./sideMenuList";

interface SideMenuProps {
  sideMenuOpen: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({ sideMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  const renderMenuItem = (item: SideListMenuType) => {
    const active = isActive(item.path);
    const hasSubMenu = item.menu && item.menu.length > 0;

    return (
      <div key={item.key} className="flex flex-col">
        <button
          onClick={() => item.path && navigate(item.path)}
          className={`
            relative flex items-center h-10 transition-all duration-200 group
            ${sideMenuOpen ? "px-3" : "justify-center"}
            ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}
          `}
        >
          {/* Active Accent Bar */}
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-accent rounded-r-full" />
          )}

          {/* Icon */}
          <div
            className={`
              flex items-center justify-center shrink-0
              ${sideMenuOpen ? "mr-3" : ""}
              ${active ? "text-accent" : ""}
            `}
          >
            {item.icon}
          </div>

          {/* Label */}
          {sideMenuOpen && (
            <span
              className={`
                text-[11px] font-bold uppercase tracking-wider truncate
                ${active ? "text-accent" : ""}
              `}
            >
              {item.name}
            </span>
          )}

          {/* Active Background Overlay (10% accent) */}
          {active && (
            <div className="absolute inset-0 bg-accent/10 -z-10 mx-1 rounded" />
          )}
        </button>

        {/* Sub-menu rendering if open and exists */}
        {sideMenuOpen && hasSubMenu && (
          <div className="flex flex-col gap-[6px] mt-[6px] border-l border-border/50 ml-6">
            {item.menu?.map((subItem) => renderMenuItem(subItem))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full py-4 gap-[6px]">
      {/* Scrollable menu area */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-1">
        <div className="flex flex-col gap-[6px]">
          {SideMenuList.map((item) => renderMenuItem(item))}
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
