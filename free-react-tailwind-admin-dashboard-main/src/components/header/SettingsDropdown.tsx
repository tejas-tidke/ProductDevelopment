


import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";

interface SettingsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SettingsDropdown({ isOpen, onToggle }: SettingsDropdownProps) {
  function closeDropdown() {
    onToggle();
  }

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={onToggle}
        aria-label="Settings"
      >
        {/* Gear icon */}
        <svg
          className="fill-current"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.4858 3.5H13.5182C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM12.0009 9.66493C10.7113 9.66493 9.6659 10.7103 9.6659 11.9999C9.6659 13.2895 10.7113 14.3349 12.0009 14.3349C13.2905 14.3349 14.3359 13.2895 14.3359 11.9999C14.3359 10.7103 13.2905 9.66493 12.0009 9.66493Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="fixed left-full ml-4 bottom-0 flex w-[220px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-60"
      >
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              to="/all-projects"
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 5.75C3 4.7835 3.7835 4 4.75 4H8.25C9.2165 4 10 4.7835 10 5.75V8.25C10 9.2165 9.2165 10 8.25 10H4.75C3.7835 10 3 9.2165 3 8.25V5.75Z" />
                <path d="M13.9998 5.75C13.9998 4.7835 14.7833 4 15.7498 4H19.2498C20.2163 4 20.9998 4.7835 20.9998 5.75V8.25C20.9998 9.2165 20.2163 10 19.2498 10H15.7498C14.7833 10 13.9998 9.2165 13.9998 8.25V5.75Z" />
                <path d="M3 15.75C3 14.7835 3.7835 14 4.75 14H8.25C9.2165 14 10 14.7835 10 15.75V18.25C10 19.2165 9.2165 20 8.25 20H4.75C3.7835 20 3 19.2165 3 18.25V15.75Z" />
                <path d="M13.9998 15.75C13.9998 14.7835 14.7833 14 15.7498 14H19.2498C20.2163 14 20.9998 14.7835 20.9998 15.75V18.25C20.9998 19.2165 20.2163 20 19.2498 20H15.7498C14.7833 20 13.9998 19.2165 13.9998 18.25V15.75Z" />
              </svg>
              Projects
            </Link>
          </li>
          <li>
            <Link
              to="/blank"
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" />
              </svg>
              User management
            </Link>
          </li>
        </ul>
      </Dropdown>
    </div>
  );
}
