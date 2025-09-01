import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { API_BASE_URL } from "@/utils";
import { Test, Student } from "@/types";
import Head from "next/head";
import { generateReportPDF } from "@/utils/pdfGenerator";
import { generateSimpleReportPDF } from "@/utils/simplePDFGenerator";
import { useModal } from "@/components/context/ModalContext";
import Loader from "@/components/Elements/Loader";

const Dashboard = () => {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const { showSuccessModal, showErrorModal } = useModal();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const studentData = localStorage.getItem("student");

    if (!token || !studentData) {
      router.push("/login");
    } else {
      const parsedData = JSON.parse(studentData);

      const fetchStudentData = async () => {
        try {
          // Fetch fresh student data from API instead of using cached data
          const response = await fetch(
            `${API_BASE_URL}/students/${parsedData._id}?year=${parsedData.year}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch student data");
          }
          const freshStudentData = await response.json();
          
          // Update localStorage with fresh data
          localStorage.setItem("student", JSON.stringify(freshStudentData));
          setStudent(freshStudentData);
          
        } catch (error) {
          console.error("Error fetching student data:", error);
          // Fallback to cached data if API fails
          try {
            const response = await fetch(
              `${API_BASE_URL}/students/?studentId=${parsedData._id}&year=${parsedData.year}`
            );
            if (!response.ok) {
              throw new Error("Failed to fetch student data");
            }
            const data = await response.json();
            
            const matchedStudent = data.find((student: Student) => student._id === parsedData._id);

            if (matchedStudent) {
              setStudent(matchedStudent);
            } else {
              console.error("No matching student found");
            }
          } catch (fallbackError) {
            console.error("Error in fallback fetch:", fallbackError);
          }
        }
      };

      fetchStudentData();
    }
  }, [router]);



  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tests/all`);
        if (!res.ok) throw new Error("Failed to fetch tests");
        const allTests: Test[] = await res.json();

        if (student) {
          const assignedTestIds = new Set(student.assignedTests.map(t => t.testId));
          // console.log(student);
          // console.log(assignedTestIds);
          const filtered = allTests.filter(test => assignedTestIds.has(test._id));
          // console.log(assignedTestIds);
          // console.log(student);
          // console.log(student.assignedTests);
          // console.log(filtered);

          setTests(filtered);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (student) {
      fetchTests();
    }
  }, [student]);



  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    window.dispatchEvent(new Event("authChange"));
    router.push("/login");
  };

  const handleDownloadReport = async (test: Test, assignedTest: any) => {
    if (!student || assignedTest?.status !== 'completed') return;

    setDownloadingReport(test._id);

    let totalMarks = 0;
    let obtainedMarks = 0;

    test.categories.forEach((category) => {
      const categoryMarks = assignedTest.marks[category.categoryName] || 0;
      obtainedMarks += categoryMarks;
      totalMarks += category.questions.length;
    });

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    try {
      console.log('Starting PDF generation with data:', {
        student: student.name,
        test: test.testName,
        obtainedMarks,
        totalMarks,
        percentage
      });

      // Try the full PDF first, fall back to simple if it fails
      try {
        await generateReportPDF({
          student,
          test,
          assignedTest,
          obtainedMarks,
          totalMarks,
          percentage
        });
        console.log('Full PDF generated successfully');
      } catch (fullPdfError) {
        console.warn('Full PDF generation failed, trying simple PDF:', fullPdfError);
        
        await generateSimpleReportPDF({
          student,
          test,
          assignedTest,
          obtainedMarks,
          totalMarks,
          percentage
        });
        console.log('Simple PDF generated successfully');
        
        showSuccessModal(
          "Report Generated",
          "A simplified report has been generated. The detailed report is temporarily unavailable due to a technical issue."
        );
      }
      
    } catch (error) {
      console.error('Error generating any PDF:', error);
      showErrorModal(
        "Report Generation Failed",
        "Unable to generate PDF report. Please try again later or contact support."
      );
    } finally {
      setDownloadingReport(null);
    }
  };

  if (!student) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 lg:px-0 min-h-screen">
      <Head>
        <title>{`Dashboard | ${student.name} | ${student.rollno}`}</title>
      </Head>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-5 font-sans mb-8">
        <div className="bg-neutral-500 w-60 h-60 rounded-lg"></div>
        <div className="space-y-2">
          <div className="text-lg font-medium">{student.name}</div>
          <div className="text-lg">{student.rollno}</div>
          <div className="text-lg">{student.email}</div>
          <div className="text-lg">
            B.Tech {student.year} {student.branch} {student.section}
          </div>
          <div className="text-lg">Semester: {student.semester}</div>
          <div className="text-lg">College Rank: 01</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold font-mono uppercase mb-4 text-gray-800">
        Your Assigned Tests ({tests.length})
      </h2>

      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader size="large" message="Loading your dashboard..." />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : tests.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No assigned tests found</p>
      ) : (
        <div className="grid grid-cols-4 xl:grid-cols-3 md:!grid-cols-1 gap-5">
          {tests.map((test) => {
            const assignedTest = student?.assignedTests.find((assignedTest) => assignedTest.testId === test._id);

            let totalMarks = 0;
            let obtainedMarks = 0;

            if (assignedTest?.status === 'completed') {
              test.categories.forEach((category) => {
                const categoryMarks = assignedTest.marks[category.categoryName] || 0;
                obtainedMarks += categoryMarks;
                totalMarks += category.questions.length;
              });
            }

            const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

            return (
              <div key={test._id} className="p-4 py-6 bg-white border-[2px] h-80 w-auto">
                <div className="flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <h2 className="text-base text-gray-900 font-mono font-semibold">
                      {test.testName}
                    </h2>
                    <div className="text-sm flex flex-col gap-0.5">
                      <div>Private</div>
                      <div>Active: <span>2 Days</span></div>
                      <div>
                        <ul className="mt-1 flex flex-wrap gap-1">
                          {test.categories.map((category) => (
                            <li
                              key={category._id}
                              className="px-4 py-0.5 w-fit text-sm border rounded-sm border-purple-700/40 bg-purple-500/20 font-mono"
                            >
                              {category.categoryName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex flex-col">
                    <div className={`my-2 py-1 px-3 text-center border font-mono font-bold capitalize
                      ${assignedTest?.status === 'completed' ? "border-green-600 bg-green-500/50 text-green-800" : "border-orange-600 bg-orange-500/50"}
                    `}>
                      {assignedTest?.status === 'completed' ? (
                        `${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%)`
                      ) : (
                        assignedTest?.status
                      )}
                    </div>

                    <Link
                      href={`/assessment/${test._id}`}
                      className={`p-2 w-full px-4 border transition-all duration-100 text-sm text-center font-medium tracking-wide
                      ${assignedTest?.status === 'completed' 
                        ? "border-yellow-600 hover:border-yellow-700 bg-yellow-500/30 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-500/40" 
                        : "border-blue-600 hover:border-blue-700 bg-blue-500/30 text-blue-800 hover:text-blue-900 hover:bg-blue-500/40" 
                      }`}
                    >
                      {assignedTest?.status === 'completed' ? `View Report` : `Take Assessment`}
                    </Link>

                    {assignedTest?.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleDownloadReport(test, assignedTest)}
                          disabled={downloadingReport === test._id}
                          className="mt-2 p-2 w-full px-4 border transition-all duration-100 text-sm text-center font-medium tracking-wide border-green-600 hover:border-green-700 bg-green-500/30 text-green-800 hover:text-green-900 hover:bg-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {downloadingReport === test._id && <Loader size="small" />}
                          {downloadingReport === test._id ? "Generating Report..." : "Download Report"}
                        </button>
                        <div className="mt-2 text-xs text-center text-gray-500 bg-gray-100 py-1 rounded">
                          🔒 Re-attempts not allowed
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
