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
      <div className="hidden lg:flex min-h-screen p-6 gap-6 relative">
        {/* Floating Side Menu */}
        <div
          className={`glass-panel transition-all duration-300 flex-shrink-0 overflow-y-auto ${
            sideMenuOpen ? "w-64" : "w-20"
          }`}
        >
          <SideMenu sideMenuOpen={sideMenuOpen} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 w-full overflow-hidden">
          {/* Floating Top Bar */}
          <div className="glass-panel z-10 flex-shrink-0">
            <TopMenu
              sideMenuOpen={sideMenuOpen}
              setSideMenuOpen={setSideMenuOpen}
            />
          </div>
          
          {/* Page content */}
          <div className="flex-1 overflow-auto glass-panel p-6">
            <div className="max-w-7xl mx-auto h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      
      {/* for Mobile View */}
      <div className="flex lg:hidden flex-col min-h-screen p-4 gap-4">
        <div className="glass-panel rounded-2xl flex-shrink-0">
           <TopMenuMobile />
        </div>

        {/* Page content */}
        <div className="flex-1 glass-panel rounded-2xl p-4 overflow-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
}
