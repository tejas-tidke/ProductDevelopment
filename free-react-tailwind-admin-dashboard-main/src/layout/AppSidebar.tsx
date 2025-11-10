import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  IssuesIcon,
  DocsIcon,
  FolderIcon,
  TaskIcon,
  ListIcon,
  PieChartIcon,
  FileIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { JIRA_CONFIG, getJiraAuthHeaders, getJiraRequestUrl } from "../config/jiraConfig";
import { jiraService } from "../services/jiraService";
import NotificationDropdown from "../components/header/NotificationDropdown";
import SettingsDropdown from "../components/header/SettingsDropdown";
import UserDropdown from "../components/header/UserDropdown";


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

// Define interface for issue
interface Issue {
  id: string;
  key: string;
  fields: {
    summary?: string;
  };
}

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

  // Bottom icons state management
  const [openBottomDropdown, setOpenBottomDropdown] = useState<'notifications' | 'settings' | 'profile' | null>(null);
  
  // Project state management
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search bar state
  const [searchTerm, setSearchTerm] = useState<string>("");







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

    // Only close the submenu if it's not the Project menu (index 0) or if no submenu matched and it's not the Project menu
    if (!submenuMatched && !(openSubmenu?.type === "main" && openSubmenu?.index === 0)) {
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

  // State for recent issues
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);

  // Fetch recent issues
  const fetchRecentIssues = async () => {
    setIssuesLoading(true);
    try {
      const issues = await jiraService.getRecentIssues();
      
      // Get first 3 issues
      const recentIssuesData = Array.isArray(issues) ? issues.slice(0, 3) : [];
      setRecentIssues(recentIssuesData);
    } catch (error) {
      console.error("Failed to fetch recent issues:", error);
      setRecentIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

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
  }, [openSubmenu, recentIssues, recentProjects, issuesLoading]);

 const navItems: NavItem[] = [
    {
    // Search bar item - special handling in renderMenuItems
    name: "search-bar",
    icon: null,
    path: "#",
  },
  {
    icon: <FolderIcon />,
    name: "Project",
    subItems: [
      { name: "Loading...", path: "#", pro: false },
    ],
  },
  {
    icon: <IssuesIcon />,
    name: "Issues",
    subItems: [
      { name: "Loading recent issues...", path: "/issues", pro: false },
    ],
  },
  {
    name: "Procurement Request",
    icon: <DocsIcon />,
    subItems: [
      { name: "Renewal", path: "/procurement/renewal", pro: false, new: true },
      { name: "New Request", path: "/procurement/new", pro: false, new: true },
    ],
  },
  {
    name: "Request Management",
    icon: <ListIcon />,
    subItems: [
      { name: "All Open", path: "/request-management/all-open" },
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
      { name: "Vendor List", path: "/vendor-management/list" },
      { name: "Vendor Contracts", path: "/vendor-management/contracts" },
      { name: "Vendor Performance", path: "/vendor-management/performance" },
    ],
  },
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/dashboard", pro: false }],
  },
];

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
  {
    name: "Pages",
    icon: <FileIcon />,
    subItems: [
      { name: "Create New User", path: "/blank", pro: false },
      { name: "Create New Project", path: "/create-new-project", pro: false },
      { name: "404 Error", path: "/error-404", pro: false },
    ],
  },
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts", pro: false },
  //     { name: "Avatar", path: "/avatars", pro: false },
  //     { name: "Badge", path: "/badge", pro: false },
  //     { name: "Buttons", path: "/buttons", pro: false },
  //     { name: "Images", path: "/images", pro: false },
  //     { name: "Videos", path: "/videos", pro: false },
  //   ],
  // },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentication",
  //   subItems: [
  //     { name: "Sign In", path: "/signin", pro: false },
  //     { name: "Sign Up", path: "/signup", pro: false },
  //   ],
  // },
];

  // Project dropdown menu component
  const ProjectDropdownMenu: React.FC<{ project: Project }> = ({ project }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Handle create issue
    const handleCreateIssue = () => {
      // Navigate to the project page with a query parameter to open the create issue modal
      navigate(`${project.path}?createIssue=true`);
      setIsOpen(false);
    };

    // Handle view issues
    const handleViewIssues = () => {
      // Navigate to the project page to view issues
      navigate(project.path);
      setIsOpen(false);
    };

    // Handle delete project
    const handleDeleteProject = async () => {
      if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
        try {
          const apiUrl = getJiraRequestUrl(`/api/jira/projects/${project.key}`);
          const headers = getJiraAuthHeaders();
          
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: headers as HeadersInit,
            mode: 'cors',
            credentials: 'omit'
          });

          if (!response.ok) {
            throw new Error(`Failed to delete project: ${response.statusText}`);
          }

          // Refresh the projects list
          window.location.reload();
        } catch (error) {
          console.error("Failed to delete project:", error);
          alert("Failed to delete project. Please try again.");
        }
      }
      setIsOpen(false);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
          aria-label="Project options"
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-0 mt-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              <button
                onClick={handleCreateIssue}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Create Issue
              </button>
              <button
                onClick={handleViewIssues}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                View Issues
              </button>
              <button
                onClick={handleDeleteProject}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Delete Project
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

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
                  if (nav.name === "Project") {
                    // Special handling for Project menu to update projects list
                    handleSubmenuToggle(index, menuType);
                  } else if (nav.name === "Issues") {
                    
                    // Special handling for Issues menu to fetch recent issues
                    if (!openSubmenu || openSubmenu.type !== menuType || openSubmenu.index !== index) {
                      fetchRecentIssues();
                    }
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
                <div className="mt-2 space-y-1 ml-9">
                  {isLoading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading projects...</div>
                  ) : error ? (
                    <div className="px-4 py-2 text-sm text-red-500">{error}</div>
                  ) : recentProjects.length > 0 ? (
                    <>
                      {recentProjects.slice(0, 3).map((project) => (
                        <div key={project.path} className="relative group flex items-center justify-between">
                          <Link
                            to={project.path}
                            className={`flex-1 block px-4 py-2 text-sm rounded-md ${
                              selectedProject === project.path
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedProject(project.path);
                              // Keep the project submenu open
                              setOpenSubmenu({ type: "main", index: 0 });
                              // Navigate to the project page
                              navigate(project.path);
                            }}
                          >
                            <div className="font-medium truncate">{project.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {project.description || "No description"}
                            </div>
                          </Link>
                          <div className="relative">
                            <ProjectDropdownMenu project={project} />
                          </div>
                        </div>
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
              ) : nav.name === 'Issues' ? (
                <div 
                  className="mt-2 space-y-1 ml-9"
                  ref={(el) => {
                    // Update the ref for issues dropdown
                    if (openSubmenu?.type === "main" && openSubmenu?.index === 1) { // Issues is at index 1
                      subMenuRefs.current[`main-1`] = el;
                      // Update height immediately when content changes
                      if (el && openSubmenu) {
                        // Use requestAnimationFrame to ensure the DOM has updated
                        requestAnimationFrame(() => {
                          setSubMenuHeight(prev => ({
                            ...prev,
                            [`main-1`]: el.scrollHeight
                          }));
                        });
                      }
                    }
                  }}
                >
                  {issuesLoading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading recent issues...</div>
                  ) : recentIssues.length > 0 ? (
                    <>
                      {recentIssues.map((issue: Issue) => (
                        <Link
                          key={issue.id}
                          to={`/issues-split/${issue.key}`}
                          className="block px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                          <div className="font-medium truncate">{issue.key}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {issue.fields?.summary || "No summary"}
                          </div>
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      <Link
                        to="/issues"
                        className="block px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      >
                        View all issues
                      </Link>
                    </>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No recent issues
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
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
      {/* Make entire sidebar content scrollable */}
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
              {renderMenuItems(navItems, "main")}
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
        {/* Account section now part of the scrollable content */}
        <div className="px-5 pb-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <h2
            className={`mb-2 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered
                ? "lg:justify-center"
                : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? (
              "Account"
            ) : (
              <HorizontaLDots className="size-6" />
            )}
          </h2>
          <div className="flex flex-col gap-2">
            {/* Notification */}
            <div className="menu-item group relative">
              <div className="flex items-center">
                <div className="relative">
                  <NotificationDropdown
                    isOpen={openBottomDropdown === 'notifications'}
                    onToggle={() => setOpenBottomDropdown(openBottomDropdown === 'notifications' ? null : 'notifications')}
                  />
                </div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text ml-3 text-gray-900 dark:text-white">Notifications</span>
                )}
              </div>
            </div>
            {/* Settings */}
            <div className="menu-item group relative">
              <div className="flex items-center">
                <div className="relative">
                  <SettingsDropdown
                    isOpen={openBottomDropdown === 'settings'}
                    onToggle={() => setOpenBottomDropdown(openBottomDropdown === 'settings' ? null : 'settings')}
                  />
                </div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text ml-3 text-gray-900 dark:text-white">Settings</span>
                )}
              </div>
            </div>
            {/* Profile */}
            <div className="menu-item group relative">
              <div className="flex items-center">
                <div className="relative">
                  <UserDropdown
                    isOpen={openBottomDropdown === 'profile'}
                    onToggle={() => setOpenBottomDropdown(openBottomDropdown === 'profile' ? null : 'profile')}
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