import { Outlet } from "react-router-dom";
import SideMenu from "./sideMenu";
import TopMenu from "./topMenu";
import TopMenuMobile from "./topMenuMobile";
import { useState } from "react";

export default function Layout() {
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(true);

  return (
    <>
      {/* For Desktop View */}
      <div className="hidden lg:flex min-h-screen p-4 gap-4 relative bg-bg">
        {/* Floating Side Menu */}
        <div
          className={`glass-panel transition-all duration-300 flex-shrink-0 overflow-y-auto ${
            sideMenuOpen ? "w-52" : "w-[52px]"
          }`}
        >
          <SideMenu sideMenuOpen={sideMenuOpen} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 w-full overflow-hidden">
          {/* Floating Top Bar */}
          <div className="glass-panel z-10 flex-shrink-0 h-12 flex items-center">
            <TopMenu
              sideMenuOpen={sideMenuOpen}
              setSideMenuOpen={setSideMenuOpen}
            />
          </div>
          
          {/* Page content */}
          <div className="flex-1 overflow-auto glass-panel p-4">
            <div className="max-w-full h-full animate-stagger">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      
      {/* for Mobile View */}
      <div className="flex lg:hidden flex-col min-h-screen p-2 gap-2 bg-bg">
        <div className="glass-panel rounded-lg flex-shrink-0">
           <TopMenuMobile />
        </div>

        {/* Page content */}
        <div className="flex-1 glass-panel rounded-lg p-2 overflow-auto animate-stagger">
          <Outlet />
        </div>
      </div>
    </>
  );
}
