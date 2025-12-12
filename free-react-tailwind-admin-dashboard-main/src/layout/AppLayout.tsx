import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation } from "react-router-dom";

import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AppHeader from "../components/header/Header";



const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const location = useLocation();
  
  // Check if we're on the request split view page and the upload quote modal is likely open
  const isUploadQuoteModalOpen = location.pathname.includes('/requests/') && location.hash === '#upload-quote';

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <Backdrop />
      <div 
        className={`relative flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {!isUploadQuoteModalOpen && <AppHeader />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;