import Link from "next/link";
import RollLogo from "./RollLogo";
import { useAuth } from "../Hooks/useAuth";
import { useState, useRef, useEffect } from "react";

type StudentDropdownProps = {
  rollno: string;
};

const menuItems = [
  { label: "Profile", href: "/dashboard" },
  { label: "Settings", href: "/settings" },
  // { label: "Help", href: "/help" },
  { label: "Logout", href: "#", className: "text-red-600 hover:bg-red-50" },
];

const StudentDropdown = ({ rollno }: StudentDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (label: string, href: string, e: React.MouseEvent) => {
    if (label === "Logout") {
      e.preventDefault();
      logout();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center">
          <Link href="/dashboard">
            <RollLogo rollno={rollno} />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1 px-2 py-1 rounded text-violet-800 font-medium text-sm hover:bg-violet-100 transition focus:outline-none"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {rollno}
          <svg
            className="w-4 h-4 fill-violet-500"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 01.02-1.06z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg z-10">
          <ul className="py-1 text-sm text-gray-700" role="menu">
            {menuItems.map(({ label, href, className }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={(e) => handleItemClick(label, href, e)}
                  className={`block px-4 py-2 hover:bg-violet-100 transition-colors ${
                    className || ""
                  }`}
                  role="menuitem"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentDropdown;
