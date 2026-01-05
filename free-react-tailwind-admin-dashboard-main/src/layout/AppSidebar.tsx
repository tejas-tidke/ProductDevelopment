import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  // IssuesIcon,
  DocsIcon,
  FolderIcon,
  TaskIcon,
  ListIcon,
  PieChartIcon,
  FileIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { jiraService } from "../services/jiraService";

import {
  SidebarHeader,
  SidebarMenuItem,
  SidebarSubMenu,
  SidebarFooter,
  SidebarSearch,
  SidebarDropdown,
} from "./Sidebar";


type NavItem = {
  name: string;
  icon: React.ReactNode | null;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

type Project = {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  path: string;
  pro?: boolean;
  new?: boolean;
};



const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth(); // Add this line to get user role information

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Bottom icons state management
  const [openBottomDropdown, setOpenBottomDropdown] = useState<'notifications' | 'settings' | 'profile' | null>(null);

  // Project state management
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  // const [selectedProject, setSelectedProject] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search bar state
  const [searchTerm, setSearchTerm] = useState<string>("");



  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);

  // 1️⃣ Global icon color (changes ALL icons)
  const globalIconColor = "green";

  // 2️⃣ Specific icon overrides (only selected ones)
  const specificIconColors: Record<string, string> = {
    "Request Management": "red",
    "Vendor Management": "aqua",
  };

  const getIconColor = (navName: string) =>
    specificIconColors[navName] ?? globalIconColor;



  // Fetch projects from backend with caching
  const fetchJiraProjects = useCallback(async () => {
    // Skip fetching if already loaded
    if (recentProjects.length > 0 || isLoading) {
      return;
    }

    console.log('Starting to fetch Jira projects from backend...');

    setIsLoading(true);
    setError(null);

    try {
      // Use jiraService with caching instead of direct fetch
      const data = await jiraService.getRecentProjects();
      console.log('Backend API response:', data);

      // Define interface for the project data from backend
      interface BackendProject {
        id: string;
        key: string;
        name: string;
        description: string;
        projectTypeKey: string;
      }

      // Transform backend projects to our Project type
      const jiraProjects: Project[] = data.map((project: BackendProject) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        projectTypeKey: project.projectTypeKey,
        path: `/project/${project.key || project.id}`,
        pro: false
      }));

      console.log('Processed recent projects:', jiraProjects);

      // Set recent projects
      setRecentProjects(jiraProjects);
    } catch (error) {
      console.error("Failed to fetch Jira projects:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      setError(errorMessage);
      setRecentProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [recentProjects.length, isLoading]);

  useEffect(() => {
    // Only fetch projects if auth is loaded and user is admin/superadmin
    if (!authLoading && (isAdmin || isSuperAdmin)) {
      fetchJiraProjects();
    }
  }, [authLoading, isAdmin, isSuperAdmin, fetchJiraProjects]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {

    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, recentProjects]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Redirect to CreateNewProject page
  const handleCreateProject = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent menu toggle
    navigate("/create-new-project");
  };

  // Log the current state for debugging
  useEffect(() => {
    console.log('Projects state updated:', { recentProjects, isLoading, error });
  }, [recentProjects, isLoading, error]);


  // Update submenu height when content changes
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;

      const updateHeight = () => {
        const element = subMenuRefs.current[key];
        if (element) {
          // Force layout calculation by accessing offsetHeight
          void element.offsetHeight; // Trigger layout (void to ignore unused expression warning)

          // Temporarily set height to auto to measure natural height
          const originalHeight = element.style.height;
          const originalOverflow = element.style.overflow;
          element.style.height = 'auto';
          element.style.overflow = 'visible';

          // Force another layout calculation
          void element.offsetHeight; // Trigger layout (void to ignore unused expression warning)

          const naturalHeight = element.offsetHeight;
          element.style.height = originalHeight;
          element.style.overflow = originalOverflow;

          setSubMenuHeight((prevHeights) => ({
            ...prevHeights,
            [key]: naturalHeight,
          }));
        }
      };

      // Use multiple attempts with proper timing
      requestAnimationFrame(() => {
        updateHeight();
        setTimeout(updateHeight, 0);
        setTimeout(updateHeight, 10);
        setTimeout(updateHeight, 50);
      });
    }
  }, [openSubmenu, recentProjects]);

  const navItems: NavItem[] = [
    {
      // Search bar item - special handling in renderMenuItems
      name: "search-bar",
      icon: null,
      path: "#",
    },

    {
      name: "Procurement Request",
      icon: <DocsIcon />,
      subItems: [
        { name: "Renewal", path: "/procurement/renewal", pro: false },
      ],
    },
    {
      name: "Request Management",
      icon: <ListIcon />,// Red color
      subItems: [
        { name: "All Request", path: "/request-management/all-open" },
        { name: "Assigned to Me", path: "/request-management/assigned-to-me" },
        { name: "Unassigned", path: "/request-management/unassigned" },
        { name: "Resolved", path: "/request-management/resolved" },
      ],
    },
    // Vendor Management dropdown - Added as requested
    {
      name: "Vendor Management",
      icon: <FolderIcon />,
      subItems: [
        { name: "Vendors", path: "/vendor-management/list" },
        { name: "Renewal ", path: "/vendor-management/VendorRenewal/Renewal_vendor" },
        { name: "Agreements", path: "/vendor-management/contracts" },
        // { name: "Vendor Performance", path: "/vendor-management/performance" },

      ],
    },
    {
      icon: <GridIcon />,
      name: "Dashboard",
      subItems: [{ name: "Ecommerce", path: "/dashboard", pro: false }],
    },
  ];

  const isPrivileged = isAdmin || isSuperAdmin;

  // Memoize filtered nav items based on user role to prevent re-rendering
  const filteredNavItems = useMemo(() => {
    // Show loading state while auth is still loading
    if (authLoading) {
      return [];
    }

    return navItems.filter(item => {
      // Hide Dashboard for non-privileged users
      if (item.name === "Dashboard" && !isPrivileged) return false;

      // Hide Procurement Request for non-admin/superadmin users
      if (item.name === "Procurement Request" && !(isSuperAdmin || isAdmin)) return false;

      // Hide Vendor Management for non-admin/superadmin users
      if (item.name === "Vendor Management" && !(isSuperAdmin || isAdmin)) return false;

      return true;
    });
  }, [navItems, isAdmin, isSuperAdmin, isPrivileged, authLoading]);

  const othersItems: NavItem[] = [
    {
      name: "Request",
      icon: <TaskIcon />,
      path: "/requests",
    },
    {
      name: "Reports",
      icon: <PieChartIcon />,
      path: "/reports",
    },
    {
      icon: <CalenderIcon />,
      name: "Calendar",
      path: "/calendar",
    },
    //  { name: "Videos", path: "/videos", pro: false },

  ];



  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          <SidebarMenuItem
            nav={nav}
            index={index}
            menuType={menuType}
            openSubmenu={openSubmenu}
            handleSubmenuToggle={handleSubmenuToggle}
            subMenuRefs={subMenuRefs}
            subMenuHeight={subMenuHeight}
            isExpanded={isExpanded}
            isHovered={isHovered}
            isMobileOpen={isMobileOpen}
            iconColor={getIconColor(nav.name)}
          />
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <SidebarSubMenu
              nav={nav}
              index={index}
              menuType={menuType}
              openSubmenu={openSubmenu}
              subMenuRefs={subMenuRefs}
              subMenuHeight={subMenuHeight}
              isExpanded={isExpanded}
              isHovered={isHovered}
              isMobileOpen={isMobileOpen}
            />
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-indigo-200 dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0`}
      onMouseEnter={() => {
        if (!isExpanded && !isInteractingWithDropdown) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isInteractingWithDropdown) {
          setIsHovered(false);
        }
      }}
    >
      <SidebarHeader
        isExpanded={isExpanded}
        isHovered={isHovered}
        isMobileOpen={isMobileOpen}
      />
      {/* Make entire sidebar content scrollable except for bottom items */}
      <div className="flex flex-col h-full">
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
          <nav className="mb-6 px-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Menu"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(filteredNavItems, "main")}
              </div>
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(othersItems, "others")}
              </div>
            </div>
          </nav>
        </div>
        <SidebarFooter
          isExpanded={isExpanded}
          isHovered={isHovered}
          isMobileOpen={isMobileOpen}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </aside>
  );
};

export default AppSidebar;