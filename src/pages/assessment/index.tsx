import Link from "next/link";
import { Test, Student } from "@/types";
import { API_BASE_URL } from "@/utils";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Loader from "@/components/Elements/Loader";
// import sampleTests from "@/lib/sample-tests.json";

const CategoryWiseTests: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get student data from localStorage
    const studentData = localStorage.getItem("student");
    if (studentData) {
      setStudent(JSON.parse(studentData));
    }
  }, []);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tests/all`);
        if (!res.ok) throw new Error("Failed to fetch tests");
        const data: Test[] = await res.json();
        setTests(data);
      } catch (err) {
        // setTests(sampleTests);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const getTestStatus = (testId: string) => {
    if (!student) return null;
    return student.assignedTests.find(test => test.testId === testId);
  };

  if (loading)
    return (
      <div className="mt-[15%] text-center text-gray-500 text-lg h-screen">
        <Loader size="large" message="Loading tests..." />
      </div>
    );

  if (error)
    return (
      <div className="mt-[15%] text-center text-red-500 text-lg h-screen">
        <div className="flex flex-col items-center gap-4">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 lg:px-0 min-h-screen">
      <Head><title>Assessments | Assessment Student Portal</title></Head>
      <h1 className="text-xl font-semibold font-mono uppercase  mb-4 text-gray-800">Available Tests ({tests.length})</h1>

      {tests.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No tests available</p>
      ) : (
        <div className="grid grid-cols-4 xl:grid-cols-3 md:!grid-cols-1 gap-5">
          {tests.map((test) => {
            const testStatus = getTestStatus(test._id);
            const isCompleted = testStatus?.status === 'completed';
            const isAssigned = testStatus !== undefined;

            return (
              <div key={test._id} className="p-4 py-6 bg-white border-[2px] h-80 w-auto">
                <div className="flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <h2 className="text-base text-gray-900 font-mono font-semibold">{test.testName}</h2>
                    <div className="text-sm flex flex-col gap-0.5">
                      <div>Public</div>
                      <div>Active: <span></span>2 Days</div>
                      <div>
                        <ul className="mt-1 flex flex-wrap gap-1">
                          {test.categories.map((category) => (
                            <li key={category._id} className="px-4 py-0.5 w-fit text-sm border rounded-sm border-purple-700/40 bg-purple-500/20 font-mono">
                              {category.categoryName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    {student && (
                      <div className="mt-2">
                        {isCompleted ? (
                          <span className="inline-block px-3 py-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded">
                            ✓ Completed
                          </span>
                        ) : isAssigned ? (
                          <span className="inline-block px-3 py-1 text-xs bg-orange-100 text-orange-800 border border-orange-300 rounded">
                            ⏳ Assigned
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-800 border border-gray-300 rounded">
                            📋 Available
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isCompleted ? (
                    <div className="space-y-2">
                      <Link 
                        href={`/assessment/${test._id}`} 
                        className="block p-2 px-4 border border-green-600 hover:border-green-700 bg-green-500/30 text-green-800 hover:text-green-900 hover:bg-green-500/40 transition-all duration-100 text-sm text-center font-medium tracking-wide"
                      >
                        View Results
                      </Link>
                      <div className="text-xs text-center text-gray-500">
                        Re-attempts not allowed
                      </div>
                    </div>
                  ) : (
                    <Link 
                      href={`/assessment/${test._id}`} 
                      className="p-2 px-4 border border-blue-600 hover:border-blue-700 bg-blue-500/30 text-blue-800 hover:text-blue-900 hover:bg-blue-500/40 transition-all duration-100 text-sm text-center font-medium tracking-wide"
                    >
                      Take Assessment
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryWiseTests;
