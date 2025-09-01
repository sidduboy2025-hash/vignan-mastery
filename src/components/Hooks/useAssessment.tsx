import { Student, Test } from "@/types";
import { API_BASE_URL } from "@/utils";
import { useRouter } from "next/router";
import { useState, useEffect, ChangeEvent } from "react";
import { useModal } from "../context/ModalContext";

interface StudentData {
    rollNo: string;
    name: string;
    email: string;
}

export const useAssessment = () => {
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [studentInfo, setStudentInfo] = useState<Student | null>(null);
    const [studentYear, setStudentYear] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, Record<string, { answer: string; submitted: boolean }>>>({});
    const [completedCategories, setCompletedCategories] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [testCompleted, setTestCompleted] = useState<boolean | null>(false);
    const [studentData, setStudentData] = useState<StudentData>({
        rollNo: '',
        name: '',
        email: '',
    });
    const router = useRouter();
    const { slug } = router.query;
    const { query } = router;
    const testId = query.slug as string;
    const { showSuccessModal, showErrorModal } = useModal();

    // Function to refresh student data
    const refreshStudentData = async () => {
        if (!studentId || !studentYear) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/students/${studentId}?year=${studentYear}`);
            if (!res.ok) throw new Error("Failed to fetch student details");
            const data = await res.json();
            setStudentInfo(data);
        } catch (err) {
            console.error("Error refreshing student data:", err);
        }
    };

    useEffect(() => {
        const student = localStorage.getItem("student");
        
        if (!student) {
            router.push("/login");
            return;
        }

        try {
            const parsedStudent = JSON.parse(student);
            // console.log(parsedStudent._id);
            setStudentId(parsedStudent._id);
            setStudentYear(parsedStudent.year);
        } catch (error) {
            console.error("Error parsing student data:", error);
            // Clear invalid data and redirect to login
            localStorage.removeItem("student");
            router.push("/login");
        }
    }, []);


    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStudentData((prev) => ({ ...prev, [name]: value }));
    };

    const startTest = async () => {
        if (!test) return;

        // Check if the test is already completed
        const currentTest = studentInfo?.assignedTests.find(test => test.testId === testId);
        if (currentTest?.status === "completed") {
            // Don't use alert, return early to prevent starting
            setIsRunning(false);
            setTestCompleted(true);
            return;
        }

        setSubmitting(true); // Show loading during test start

        try {
            const res = await fetch(`${API_BASE_URL}/tests/${test._id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentId,
                    testId: test._id,
                    year: studentYear,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsRunning(true);
                setTestCompleted(false)
            } else {
                setTestCompleted(true)
                showErrorModal(
                    "Failed to Start Test",
                    `Unable to start the test: ${data.message}`
                );
            }
        } catch (err) {
            showErrorModal(
                "Start Test Error",
                "An error occurred while starting the test. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };


    const endTest = () => {
        setIsRunning(false);
        // localStorage.removeItem(`timer-${slug}`);
    };

    useEffect(() => {
        if (!testId) return;
        const fetchTest = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/tests/${testId}`);
                if (!res.ok) throw new Error("Failed to fetch test details");
                const data: Test = await res.json();

                // Utility: Fisher-Yates shuffle to randomize array in-place
                const shuffleArray = <T,>(arr: T[]): T[] => {
                    const a = [...arr];
                    for (let i = a.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                };

                // Assumption: We randomize the order of questions within each category
                const shuffledTest: Test = {
                    ...data,
                    categories: data.categories.map(cat => ({
                        ...cat,
                        questions: shuffleArray(cat.questions),
                    })),
                };

                setTest(shuffledTest);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [testId]);

    useEffect(() => {
        if (!studentId) return;

        const fetchStudent = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/students/${studentId}?year=${studentYear}`);
                if (!res.ok) throw new Error("Failed to fetch student details");
                const data = await res.json();

                setStudentInfo(data);

            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentId, studentYear]);

    useEffect(() => {
        if (!studentInfo?.assignedTests || !testId) return;

        const currentTest = studentInfo.assignedTests.find(test => test.testId === testId);

        if (currentTest?.status === "completed") {
            setIsRunning(false);
            setTestCompleted(true);
        }

        if (currentTest?.status === "in-progress") {
            setIsRunning(true);
            setTestCompleted(false);
        }
    }, [studentInfo, testId]);

    const handleAnswerSelect = (categoryName: string, qId: string, option: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [categoryName]: {
                ...prev[categoryName],
                [qId]: { answer: option, submitted: false },
            },
        }));
    };

    const handleQuestionSubmit = (categoryName: string, qId: string) => {
        setSelectedAnswers((prev) => {
            const isCurrentlySubmitted = prev[categoryName]?.[qId]?.submitted || false;
            return {
                ...prev,
                [categoryName]: {
                    ...prev[categoryName],
                    [qId]: {
                        submitted: !isCurrentlySubmitted,
                        answer: isCurrentlySubmitted ? "" : prev[categoryName]?.[qId]?.answer,
                    },
                },
            };
        });
    };

    const handleSubmit = async () => {
        if (!test || submitting) return;
        
        setSubmitting(true);

        const completed = test.categories
            .filter(category =>
                category.questions.every(q =>
                    selectedAnswers[category.categoryName]?.[q._id]?.submitted
                )
            )
            .map(cat => cat.categoryName);

        setCompletedCategories(completed);

        // Calculate answered questions count for display
        const totalQuestions = test.categories.reduce((total, category) => total + category.questions.length, 0);
        const answeredQuestions = test.categories.reduce((total, category) => {
            return total + category.questions.filter(q => 
                selectedAnswers[category.categoryName]?.[q._id]?.submitted
            ).length;
        }, 0);

        console.log(`Submitting test with ${answeredQuestions}/${totalQuestions} questions answered`);

        // Compute marks for all questions (including unanswered ones)
        const marks: Record<string, number> = {};

        test.categories.forEach(category => {
            let score = 0;

            category.questions.forEach(question => {
                const submittedAnswer = selectedAnswers[category.categoryName]?.[question._id];
                // Only count as correct if answered and correct
                if (submittedAnswer?.submitted && submittedAnswer?.answer === question.correctAnswer) {
                    score += 1;
                }
            });

            marks[category.categoryName] = score;
        });

        try {
            const res = await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentId,
                    testId: test._id,
                    year: studentYear,
                    marks
                })
            });

            const data = await res.json();

            if (res.ok) {
                console.log("Test marks submitted:", data);
                
                // Update local state to reflect completion
                setTestCompleted(true);
                setIsRunning(false);
                
                // Refresh student data to get updated test status
                await refreshStudentData();
                
                // Update localStorage with fresh student data
                try {
                    const studentRes = await fetch(`${API_BASE_URL}/students/${studentId}?year=${studentYear}`);
                    if (studentRes.ok) {
                        const freshStudentData = await studentRes.json();
                        localStorage.setItem("student", JSON.stringify(freshStudentData));
                    }
                } catch (localStorageError) {
                    console.error("Error updating localStorage:", localStorageError);
                }
                
                showSuccessModal(
                    "Test Submitted Successfully!",
                    "Your test has been submitted and scored. The page will refresh to show your results.",
                    () => {
                        // Force a page refresh to ensure all data is updated
                        window.location.reload();
                    }
                );
                
                endTest();
            } else {
                console.error("Submission failed:", data.message);
                showErrorModal(
                    "Submission Failed",
                    `Failed to submit test: ${data.message}`,
                    () => {
                        setSubmitting(false);
                    }
                );
            }
        } catch (err) {
            console.error("Error during submission:", err);
            showErrorModal(
                "Submission Error",
                "Error submitting test. Please try again.",
                () => {
                    setSubmitting(false);
                }
            );
        } finally {
            // Only set submitting to false if not already handled by error modals
            setTimeout(() => setSubmitting(false), 100);
        }

        // scroll to top
        window.scrollTo(0, 0);
    };

    // Handle automatic submission (for malpractice)
    const handleAutoSubmit = async (reason: string = 'automatic') => {
        if (!test || submitting) return;
        
        console.log(`Auto-submitting test due to: ${reason}`);
        
        // Calculate answered questions count for logging
        const totalQuestions = test.categories.reduce((total, category) => total + category.questions.length, 0);
        const answeredQuestions = test.categories.reduce((total, category) => {
            return total + category.questions.filter(q => 
                selectedAnswers[category.categoryName]?.[q._id]?.submitted
            ).length;
        }, 0);

        console.log(`Auto-submitting with ${answeredQuestions}/${totalQuestions} questions answered`);
        
        // Use the same submission logic but skip user confirmation
        await handleSubmit();
    };

    // const isTestCompleted = async () => {
    //     const testId = test?._id;
    //     try {
    //         const res = await fetch(`${API_BASE_URL}/students`);
    //         const students: Student[] = await res.json();

    //         // Find the student by studentId
    //         const student = students.find((student) => student._id === studentId);

    //         if (student) {
    //             // Check if the specific test is completed
    //             const isCompleted = student.assignedTests.some((test) => test.testId === testId && test.status === "completed");
    //             return isCompleted;
    //         } else {
    //             // If the student is not found, return false or handle accordingly
    //             return false;
    //         }
    //     } catch (error) {
    //         console.error("Error fetching student data:", error);
    //         return false;
    //     }
    // }

    // useEffect(() => {
    //     const checkTestCompletion = async () => {
    //         const completed = await isTestCompleted();
    //         setTestCompleted(completed);
    //     };

    //     checkTestCompletion();
    // }, [testId, studentId]);

    // if (testCompleted === null) {
    //     return <div>Loading...</div>;
    // }

    const calculateCategoryStats = (categoryName: string) => {
        const category = test?.categories.find(cat => cat.categoryName === categoryName);
        if (!category) return { score: 0, percentage: "0.00" };
        let correct = 0;
        category.questions.forEach(q => {
            if (selectedAnswers[categoryName]?.[q._id]?.answer === q.correctAnswer) {
                correct++;
            }
        });
        const percentage = ((correct / category.questions.length) * 100).toFixed(2);
        return { score: correct, percentage };
    };

    return {
        test,
        loading,
        submitting,
        error,
        selectedAnswers,
        testCompleted,
        studentInfo,
        completedCategories,
        isRunning,
        studentData,
        slug: testId,
        handleChange,
        startTest,
        endTest,
        handleAnswerSelect,
        handleQuestionSubmit,
        handleSubmit,
        handleAutoSubmit,
        calculateCategoryStats,
    };
}
