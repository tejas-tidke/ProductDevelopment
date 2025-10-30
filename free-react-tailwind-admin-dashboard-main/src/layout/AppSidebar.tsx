import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  HorizontaLDots
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { JIRA_CONFIG, getJiraAuthHeaders, getJiraRequestUrl } from "../config/jiraConfig";

type NavItem = {
  name: string;
  icon: React.ReactNode;
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

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Project state management
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from backend
  const fetchJiraProjects = async () => {
    console.log('Starting to fetch Jira projects from backend...');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = getJiraRequestUrl(JIRA_CONFIG.apiEndpoints.recentProjects);
      console.log('Making request to:', apiUrl);
      
      const headers = getJiraAuthHeaders();
      
      const response = await fetch(apiUrl, {
        headers: headers as HeadersInit,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl
        });
        
        let errorMessage = `Backend API error (${response.status}): ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
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
      if (jiraProjects.length > 0) {
        setSelectedProject(jiraProjects[0].path);
      }
    } catch (error) {
      console.error("Failed to fetch Jira projects:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      setError(errorMessage);
      setRecentProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJiraProjects();
  }, []);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    // Update selected project when route changes
    const currentProject = recentProjects.find(project => project.path === location.pathname);
    if (currentProject) {
      setSelectedProject(location.pathname);
    }
    
    // Handle submenu opening based on active route
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

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, recentProjects]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

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

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Project",
      subItems: [
        // This will be overridden by dynamic content
        { name: "Loading...", path: "#", pro: false },
      ],
    },
    {
      icon: <GridIcon />,
      name: "Dashboard",
      subItems: [{ name: "Ecommerce", path: "/dashboard", pro: false }],
    },
    {
      icon: <CalenderIcon />,
      name: "Calendar",
      path: "/calendar",
    },
    {
      icon: <UserCircleIcon />,
      name: "User Profile",
      path: "/profile",
    },
    {
      icon: <UserCircleIcon />,
      name: "User Data Check",
      path: "/user-data-check",
    },
    {
      name: "Forms",
      icon: <ListIcon />,
      subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
    },
    {
      name: "Tables",
      icon: <TableIcon />,
      subItems: [
        { name: "Basic Tables", path: "/basic-tables", pro: false },
      ],
    },
    {
      name: "Pages",
      icon: <PageIcon />,
      subItems: [
        { name: "Blank Page", path: "/blank", pro: false },
        { name: "Create New Project", path: "/create-new-project", pro: false },
        { name: "404 Error", path: "/error-404", pro: false },
      ],
    },
  ];

  const othersItems: NavItem[] = [
    {
      icon: <PieChartIcon />,
      name: "Charts",
      subItems: [
        { name: "Line Chart", path: "/line-chart", pro: false },
        { name: "Bar Chart", path: "/bar-chart", pro: false },
      ],
    },
    {
      icon: <BoxCubeIcon />,
      name: "UI Elements",
      subItems: [
        { name: "Alerts", path: "/alerts", pro: false },
        { name: "Avatar", path: "/avatars", pro: false },
        { name: "Badge", path: "/badge", pro: false },
        { name: "Buttons", path: "/buttons", pro: false },
        { name: "Images", path: "/images", pro: false },
        { name: "Videos", path: "/videos", pro: false },
      ],
    },
    {
      icon: <PlugInIcon />,
      name: "Authentication",
      subItems: [
        { name: "Sign In", path: "/signin", pro: false },
        { name: "Sign Up", path: "/signup", pro: false },
      ],
    },
  ];

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
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
                  if (nav.name === "Project") {
                    // Special handling for Project menu to update projects list
                    handleSubmenuToggle(index, menuType);
                  } else {
                    handleSubmenuToggle(index, menuType);
                  }
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
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="flex-1 text-left text-sm font-medium">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && nav.subItems && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 flex-shrink-0 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
              {/* Plus icon for Project menu */}
              {(isExpanded || isHovered || isMobileOpen) && nav.name === "Project" && (
                <button
                  onClick={handleCreateProject}
                  className="ml-2 flex items-center justify-center w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition-colors"
                  title="Create New Project"
                >
                  +
                </button>
              )}
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
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              {nav.name === 'Project' ? (
                <div className="mt-2 space-y-1 ml-9">
                  {isLoading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading projects...</div>
                  ) : error ? (
                    <div className="px-4 py-2 text-sm text-red-500">{error}</div>
                  ) : recentProjects.length > 0 ? (
                    <>
                      {recentProjects.map((project) => (
                        <Link
                          key={project.path}
                          to={project.path}
                          className={`block px-4 py-2 text-sm rounded-md ${
                            selectedProject === project.path
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="font-medium truncate">{project.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {project.description || "No description"}
                          </div>
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      <Link
                        to="/all-projects"
                        className="block px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      >
                        View all projects
                      </Link>
                    </>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No projects available
                    </div>
                  )}
                </div>
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      }
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
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
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
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
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;