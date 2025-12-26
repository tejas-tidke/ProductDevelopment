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

import SettingsDropdown from "../components/header/ui/SettingsDropdown";
import UserDropdown from "../components/header/ui/UserDropdown";


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
    icon: <ListIcon />,
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
          {nav.name === "search-bar" ? (
            // Special case: Render search bar instead of navigation item
            <div className="menu-item group menu-item-inactive">
              <div className="flex items-center flex-1">
                <div className="menu-item-icon-size menu-item-icon-inactive">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <div className="flex-1 ml-3">
                    <input
                      type="text"
                      placeholder="Evaluate a Tool"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // Handle search submission
                          if (searchTerm.trim()) {
                            // Navigate to search results page
                            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                          }
                        }
                      }}
                      className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : nav.subItems ? (
            <div
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              } overflow-visible relative flex items-center`}
            >
              <button
                onClick={() => {
                  handleSubmenuToggle(index, menuType);
                }}
                className="flex items-center flex-1 bg-transparent border-0 p-0 cursor-pointer"
              >
                <span
                  className={`menu-item-icon-size  ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon || <div className="w-5 h-5" />}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="flex-1 text-left text-sm font-medium ml-3">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && nav.subItems && (
                  <div className="ml-auto flex items-center gap-2">
                    {nav.name === "Project" && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateProject(e);
                        }}
                        className="flex items-center justify-center w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition-colors cursor-pointer"
                        title="Create New Project"
                      >
                        +
                      </span>
                    )}
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${
                        openSubmenu?.type === menuType &&
                        openSubmenu?.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  </div>
                )}
              </button>

            </div>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon || <div className="w-5 h-5" />}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text ml-3">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300 relative z-20"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? (index === 1 ? 'auto' : `${subMenuHeight[`${menuType}-${index}`]}px`)
                    : "0px",
              }}
            >
              {nav.name === 'Project' ? (
                null
              ) : nav.name === 'Issues' ? (
                null
              ) : (
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.path}>
                      <Link
                        to={subItem.path}
                        className={`block px-4 py-2 text-sm rounded-md ${
                          isActive(subItem.path)
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        {subItem.name}
                        {subItem.new && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            New
                          </span>
                        )}
                        {subItem.pro && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                            Pro
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-indigo-200 dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
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
      <div
        className={`py-8 px-5 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo1.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block dark:invert dark:brightness-0 dark:contrast-100"
                src="/images/logo/logo1.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo1.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      {/* Make entire sidebar content scrollable except for bottom items */}
      <div className="flex flex-col h-full">
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
          <nav className="mb-6 px-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
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
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
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
        
        {/* Fixed bottom items */}
        <div className="flex-shrink-0 pb-4 px-5">
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Settings - Only visible for Admin and Super Admin */}
            {(isAdmin || isSuperAdmin) && (
              <div className="menu-item group relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center">
                  <div className="relative">
                    <SettingsDropdown
                      isOpen={openBottomDropdown === 'settings'}
                      onToggle={() => {
                        setIsInteractingWithDropdown(true);
                        setOpenBottomDropdown(openBottomDropdown === 'settings' ? null : 'settings');
                      }}
                    />
                  </div>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text ml-3 text-gray-900 dark:text-white">Settings</span>
                  )}
                </div>
              </div>
            )}

            {/* Profile */}
            <div className="menu-item group relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center">
                <div className="relative">
                  <UserDropdown
                    isOpen={openBottomDropdown === 'profile'}
                    onToggle={() => {
                      setOpenBottomDropdown(openBottomDropdown === 'profile' ? null : 'profile');
                    }}
                  />
                </div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text ml-3 text-gray-900 dark:text-white">Profile</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;