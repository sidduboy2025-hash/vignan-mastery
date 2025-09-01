import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import StudentDropdown from "../Elements/StudentDropdown";
import VIGNAN from "../../../public/assets/images/vignan-logo.png";
import VIGNAN_HEADER from "../../../public/assets/images/vignan-header.jpeg";

const Header = () => {
  const [rollno, setRollno] = useState<string | null>(null);

  const loadStudent = () => {
    const studentData = localStorage.getItem("student");
    if (studentData) {
      try {
        const student = JSON.parse(studentData);
        setRollno(student.rollno);
      } catch {
        setRollno(null);
      }
    } else {
      setRollno(null);
    }
  };

  useEffect(() => {
    loadStudent();
    // listing for login/logout changes
    const handleAuthChange = () => loadStudent();
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  return (
    <div className="h-24 lg:h-14 bg-white -mx-3 lg:m-0 flex justify-center w-full">
      <div className="py-3 max-w-6xl w-full flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1.5">
          <Image src={VIGNAN} width={42} height={42} alt="Vignan Logo" />
          <span className="text-violet-900 font-semibold text-lg whitespace-nowrap xs:text-base">
            Assessment Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/">
            <Image
              src={VIGNAN_HEADER}
              className="h-20 w-full object-contain lg:hidden"
              alt="Vignan Header"
            />
          </Link>
          <div className="w-fit flex gap-2 lg:hidden">
            <Link href="/assessment" className="hover:text-violet-900 hover:underline">
              Assessments
            </Link>
            {/* <Link href="/practice" className="hover:text-violet-900 hover:underline">
              Practice
            </Link>
            <Link href="/dashboard" className="hover:text-violet-900 hover:underline">
              Dashboard
            </Link> */}
          </div>
        </div>

        <div>
          {rollno ? (
            <div className="px-4 py-1 text-violet-800 font-medium text-base rounded xs:text-sm">
              <StudentDropdown rollno={rollno} />
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full text-right px-4 py-1 border border-violet-600 hover:border-violet-900 bg-violet-500/20 text-violet-800 text-base font-medium rounded cursor-pointer xs:text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
