import { Test } from "@/types";
import { API_BASE_URL } from "@/utils";
import { useEffect, useState } from "react";
import { useAssessment } from "../Hooks/useAssessment";
import Loader from "./Loader";

interface AssignedTest {
    timeLimit: number; // not in db
    testId: string;
    status: string;
    marks: Record<string, number>;
    submittedAt: string | null;
    start: string;
}

interface Student {
    _id: string;
    rollno: string;
    name: string;
    email: string;
    year: number;
    branch: string;
    section: string;
    semester: number;
    assignedTests: AssignedTest[];
}

interface StudentWithScore extends Student {
    totalScore: number;
    timeTaken: number;
    timeLimit: number;
    completedOnTime: boolean;
}

interface StudentWithRank extends StudentWithScore {
    rank: number;
}

interface RankData {
    overall: StudentWithRank[];
    byYear: { [year: string]: StudentWithRank[] };
    byBranch: { [branch: string]: StudentWithRank[] };
    bySection: {
        [key: string]: {
            sectionKey: string;
            sectionName: string;
            students: StudentWithRank[];
        };
    };
}

const tabs = ["Overall", "By Year", "By Branch", "By Section"] as const;
type TabType = (typeof tabs)[number];

const RankCard = ({ studentId, test }: { studentId: string; test: Test }) => {
    const {
        studentInfo,
        calculateCategoryStats,
    } = useAssessment();
    const testId = test._id;
    const [activeTab, setActiveTab] = useState<TabType>("Overall");
    // const [studentRank, setStudentRank] = useState(null);
    const [rankData, setRankData] = useState<RankData>({
        overall: [],
        byYear: {},
        byBranch: {},
        bySection: {},
    });
    const [showCount, setShowCount] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndRank = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/students`);
                const students: Student[] = await res.json();
                // console.log(students);
                // console.log(studentId);

                const selectedStudent = students.find((student) => student._id === studentId) || null;
                // console.log(selectedStudent);
                // setStudent(selectedStudent);                

                const attempted: StudentWithScore[] = students
                    .map((student) => {
                        const test = student.assignedTests.find(
                            (t) => t.testId === testId && t.status === "completed"
                        );
                        if (!test) return null;

                        const totalScore = Object.values(test.marks || {}).reduce(
                            (acc, val) => acc + val,
                            0
                        );

                        const start = new Date(test.start).getTime();
                        const submittedAt = test.submittedAt ? new Date(test.submittedAt).getTime() : 0;
                        const timeLimit = test.timeLimit || 30 * 60 * 1000; // 30 minutes in milliseconds
                        const timeTaken = submittedAt - start;

                        const completedOnTime = timeTaken <= timeLimit;

                        return {
                            ...student,
                            totalScore,
                            timeTaken,
                            timeLimit,
                            completedOnTime
                        };
                    })
                    .filter(Boolean) as StudentWithScore[];

                const overall = rankList(attempted);
                const byYear = groupAndRank(attempted, "year");
                const byBranch = groupAndRank(attempted, "branch");
                const bySectionRaw = groupAndRankBySection(attempted);

                setRankData({ overall, byYear, byBranch, bySection: bySectionRaw });

                const initialCounts: Record<string, number> = {
                    Overall: 10,
                    ...Object.fromEntries(Object.keys(byYear).map((k) => [`Year-${k}`, 10])),
                    ...Object.fromEntries(Object.keys(byBranch).map((k) => [`Branch-${k}`, 10])),
                    ...Object.fromEntries(
                        Object.values(bySectionRaw).map(({ sectionKey }) => [sectionKey, 10])
                    ),
                };
                setShowCount(initialCounts);
            } catch (err) {
                console.error("Failed to fetch student data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndRank();
    }, [studentId, testId]);

    // console.log(studentInfo);


    // const totalCorrect = test.categories.reduce((total, category) => {
    //     const categoryScore = calculateCategoryStats(category.categoryName).score;
    //     const assignedTestMarks = studentInfo?.assignedTests.find(
    //         (assignedTest) => assignedTest.testId === test._id
    //     )?.marks[category.categoryName] || 0;
    //     console.log(test._id);
    //     console.log(assignedTestMarks);
    //     console.log(studentInfo?.assignedTests);

    //     return total + categoryScore + assignedTestMarks;
    // }, 0) || 0;

    const rankList = (students: StudentWithScore[]): StudentWithRank[] =>
        students
            .sort((a, b) => b.totalScore - a.totalScore || a.timeTaken - b.timeTaken)
            .map((s, i) => ({ ...s, rank: i + 1 }));

    const groupAndRank = (
        students: StudentWithScore[],
        key: "year" | "branch"
    ): { [key: string]: StudentWithRank[] } => {
        const groups: Record<string, StudentWithScore[]> = {};
        students.forEach((student) => {
            const groupKey = String(student[key]);
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(student);
        });
        return Object.fromEntries(
            Object.entries(groups).map(([k, v]) => [k, rankList(v)])
        );
    };

    const groupAndRankBySection = (
        students: StudentWithScore[]
    ): RankData["bySection"] => {
        const groups: Record<string, StudentWithScore[]> = {};
        students.forEach((student) => {
            const key = `${student.year}-${student.branch}-${student.section}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(student);
        });

        return Object.fromEntries(
            Object.entries(groups).map(([key, group]) => [
                key,
                {
                    sectionKey: key,
                    sectionName: key.replace(/-/g, " | "),
                    students: rankList(group),
                },
            ])
        );
    };

    const renderRankSection = (
        title: string,
        students: StudentWithRank[],
        key: string
    ) => {
        const visibleCount = showCount[key] || 10;
        const showMore = students.length > visibleCount;
        console.log(students);


        return (
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-md border border-gray-300">
                <h3 className="text-xl font-mono uppercase font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-indigo-600 mr-2">🏆</span>
                    {title}
                </h3>
                <div className="space-y-4 font-sans">
                    {students.slice(0, visibleCount).map((student) => {
                        const assignedTest = student?.assignedTests.find(
                            (assignedTest) => assignedTest.testId === testId
                        );
                        console.log(assignedTest?.start);
                        let timeTaken = "";
                        if (assignedTest?.start && assignedTest?.submittedAt) {
                            const start = new Date(assignedTest.start);
                            const submittedAt = new Date(assignedTest.submittedAt);

                            const timeTakenMs = submittedAt.getTime() - start.getTime();
                            const totalSeconds = Math.floor(timeTakenMs / 1000);

                            const cappedSeconds = Math.min(totalSeconds, 30 * 60);

                            const hours = Math.floor(cappedSeconds / 3600);
                            const minutes = Math.floor((cappedSeconds % 3600) / 60);
                            const seconds = cappedSeconds % 60;

                            const pad = (n: number) => n.toString().padStart(2, "0");
                            timeTaken = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                        }

                        return (
                            <div
                                key={student._id}
                                className={`flex min-w-80 lg:w-auto justify-between items-center px-6 py-3 rounded-lg transition-transform transform ${student._id === studentId
                                    ? "bg-gradient-to-r from-green-100 to-green-300 text-green-900 border border-green-400 shadow-lg scale-105"
                                    : "bg-white text-gray-800"
                                    }`}
                            >
                                <span className="flex items-center space-x-3">
                                    <span className="text-2xl text-indigo-500 font-semibold">{student.rank}</span>
                                    <span className="flex flex-col">
                                        <span className="truncate font-medium text-lg">{student.name}</span>
                                        <span className="text-sm text-gray-600 font-mono">({student.rollno})</span>
                                    </span>
                                </span>
                                <div className="flex flex-col items-end space-y-1">
                                    <span className="text-sm text-gray-500">Score:</span>
                                    <span className="text-xl font-semibold text-gray-900">{student.totalScore}</span>
                                    <span className="text-sm text-gray-500">
                                        Time Taken: {timeTaken || 0}s
                                    </span>
                                    {/* <span className="text-sm text-gray-500">
                                        {student.completedOnTime ? "Completed on time" : "Completed late"}
                                    </span> */}
                                </div>
                            </div>)
                    })}
                </div>
                {showMore && (
                    <button
                        onClick={() =>
                            setShowCount((prev) => ({ ...prev, [key]: prev[key] + 10 }))}
                        className="text-indigo-600 text-sm mt-4 hover:text-indigo-800 focus:outline-none transition-colors"
                    >
                        Show More <span className="inline-block ml-2">🔽</span>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="">
            <div className="max-w-2xl mx-auto p-6 bg-white border rounded-xl shadow-sm  text-gray-800 mb-6 font-sans">
                <h2 className="text-xl font-semibold font-mono uppercase text-center text-neutral-800 mb-5 lg:mb-3">Academic Rank Card</h2>
                
                {/* Provisional Rank Notice */}
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-600">⚠️</span>
                        <p className="text-sm text-amber-800 font-medium">
                            <strong>Note:</strong> The ranks displayed here are provisional and based only on submissions received so far. 
                            Final rankings will be generated after the exam period ends.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader size="large" message="Loading rankings..." />
                    </div>
                ) : (
                    <>
                        <div className="flex justify-evenly gap-4">
                            <div className="space-y-2">
                                <p><strong>Roll No:</strong> {studentInfo?.rollno || "N/A"}</p>
                                <p><strong>Name:</strong> {studentInfo?.name || "N/A"}</p>
                                <p><strong>Email:</strong> {studentInfo?.email || "N/A"}</p>
                                <p><strong>Year:</strong> {studentInfo?.year || "N/A"}</p>
                                <p><strong>Branch:</strong> {studentInfo?.branch || "N/A"}</p>
                                <p><strong>Semester:</strong> {studentInfo?.semester || "N/A"}</p>
                            </div>

                            <div className="space-y-2">
                                <p><strong>Overall Rank:</strong>{" "}
                                    {Object.entries(rankData.overall).map(([_, s]) =>
                                        s._id === studentId ? s.rank : null
                                    )}
                                </p>
                                <p><strong>Year Rank:</strong>{" "}
                                    {Object.entries(rankData.byYear).map(([_, list]) =>
                                        list.find(s => s._id === studentId)?.rank
                                    )}
                                </p>
                                <p><strong>Branch Rank:</strong>{" "}
                                    {Object.entries(rankData.byBranch).map(([_, list]) =>
                                        list.find(s => s._id === studentId)?.rank
                                    )}
                                </p>
                                <p><strong>Section Rank:</strong>{" "}
                                    {Object.entries(rankData.bySection).map(([_, list]) =>
                                        list.students.find(s => s._id === studentId)?.rank
                                    )}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
                {(() => {
                    const assignedTest = studentInfo?.assignedTests.find(
                        (assignedTest) => assignedTest.testId === test._id
                    );
                    const marks = assignedTest?.marks;

                    if (marks && Object.keys(marks).length > 0) {
                        return Object.entries(marks).map(([categoryName, assignedTestMarks]) => {
                            const category = test.categories.find(
                                (cat) => cat.categoryName === categoryName
                            );
                            const percentage = (
                                (assignedTestMarks / (category?.questions.length || 1)) *
                                100
                            ).toFixed(2);

                            return (
                                <div key={categoryName} className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-gray-300 font-sans">
                                    <h3 className="text-xl font-semibold font-mono uppercase text-left text-neutral-800">
                                        {categoryName}
                                    </h3>
                                    <p className="text-lg">
                                        Score: {assignedTestMarks}/{category?.questions.length}
                                    </p>
                                    <p className="text-lg">Correct Score: {percentage}%</p>
                                    {/* <p className="text-lg">Assigned Test Marks: {assignedTestMarks}</p> */}
                                </div>
                            );
                        });
                    } else {
                        return test.categories.map((category) => {
                            const { score, percentage } = calculateCategoryStats(category.categoryName);

                            return (
                                <div key={category.categoryName} className="p-6 border border-neutral-500 font-sans">
                                    <h3 className="text-xl font-semibold font-mono uppercase text-left text-neutral-800">
                                        {category.categoryName}
                                    </h3>
                                    <p className="text-lg">
                                        Score: {score}/{category.questions.length}
                                    </p>
                                    <p className="text-lg">Correct Score: {percentage}%</p>
                                </div>
                            );
                        });
                    }
                })()}
            </div>
            <div className="flex gap-4 border-b mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`py-2 px-3 border-b-2 font-sans font-medium ${activeTab === tab
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500"
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "Overall" &&
                renderRankSection("Overall Rankings", rankData.overall, "Overall")}

            {activeTab === "By Year" &&
                <div className="flex lg:flex-col gap-4">
                    {Object.entries(rankData.byYear).map(([key, list]) =>
                        renderRankSection(`Year - ${key}`, list, `Year-${key}`)
                    )}
                </div>
            }

            {activeTab === "By Branch" &&
                <div className="flex lg:flex-col gap-4">
                    {Object.entries(rankData.byBranch).map(([key, list]) =>
                        renderRankSection(`Branch - ${key}`, list, `Branch-${key}`)
                    )}
                </div>
            }

            {activeTab === "By Section" &&
                <div className="flex lg:flex-col gap-4">
                    {Object.entries(rankData.bySection).map(([_, { sectionKey, sectionName, students }]) =>
                        renderRankSection(`Section - ${sectionName}`, students, sectionKey)
                    )}
                </div>
            }
        </div>
    );
};

export default RankCard;
