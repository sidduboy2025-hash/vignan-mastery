import Link from "next/link";
import { Student } from "@/types/index";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAssessment } from "@/components/Hooks/useAssessment";
import CountdownTimer from "@/components/Elements/CoutdownTimer";
import Head from "next/head";
import RankCard from "@/components/Elements/RankCard";
import TestStartConfirmation from "@/components/Elements/TestStartConfirmation";
import { useFullscreenMonitor } from "@/components/Hooks/useFullscreenMonitor";
import TestSecurityIndicator from "@/components/Elements/TestSecurityIndicator";
import TestSecurityInstructions from "@/components/Elements/TestSecurityInstructions";
import TestResults from "@/components/Elements/TestResults";
import { useModal } from "@/components/context/ModalContext";
import Loader from "@/components/Elements/Loader";
import LoadingOverlay from "@/components/Elements/LoadingOverlay";

const AssessmentSlug = () => {
  const router = useRouter();
  const {
    loading,
    submitting,
    error,
    test,
    isRunning,
    selectedAnswers,
    testCompleted,
    studentData,
    studentInfo,
    handleChange,
    startTest,
    handleAnswerSelect,
    handleQuestionSubmit,
    handleSubmit,
    handleAutoSubmit,
    endTest,
    slug,
    completedCategories,
    calculateCategoryStats,
  } = useAssessment();

  const [student, setStudent] = useState<Student | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSecurityInstructions, setShowSecurityInstructions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const { showWarningModal, showConfirmModal } = useModal();
  
  const QUESTIONS_PER_PAGE = 25;

  useEffect(() => {
    if (studentInfo && slug) {
      const currentTest = studentInfo.assignedTests.find(test => test.testId === slug);
      
      if (currentTest?.status === "completed") {
        // Test is completed, the useAssessment hook will handle the state
        return;
      }
    }
  }, [studentInfo, slug]);

  // Handle test submission due to malpractice
  const handleTestSubmitDueToMalpractice = (reason: 'malpractice' | 'manual') => {
    if (reason === 'malpractice') {
      // Log the malpractice submission
      console.warn('Test automatically submitted due to malpractice');
      
      // Calculate answered questions for logging
      const totalQuestions = test?.categories.reduce((total, category) => total + category.questions.length, 0) || 0;
      const answeredQuestions = test?.categories.reduce((total, category) => {
        return total + category.questions.filter(q => 
          selectedAnswers[category.categoryName]?.[q._id]?.submitted
        ).length;
      }, 0) || 0;
      
      showWarningModal(
        "Test Submitted Due to Security Violation",
        `Test automatically submitted due to security violation.\n\nAnswered: ${answeredQuestions}/${totalQuestions} questions\nUnanswered questions are marked as incorrect.`,
        () => {
          // Submit the test using auto-submit function
          handleAutoSubmit(reason);
        }
      );
    } else {
      // Submit the test using auto-submit function
      handleAutoSubmit(reason);
    }
  };

  // Fullscreen monitoring
  const {
    startMonitoring,
    stopMonitoring,
    warningCount,
    remainingWarnings,
    isMonitoring,
    securityStatus
  } = useFullscreenMonitor({
    onTestSubmit: handleTestSubmitDueToMalpractice,
    maxWarnings: 3,
    isTestActive: isRunning
  });

  useEffect(() => {
    const stored = localStorage.getItem("student");
    if (stored) {
      setStudent(JSON.parse(stored));
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'ArrowLeft' && !isFirstPage()) {
          event.preventDefault();
          handlePreviousPage();
        } else if (event.key === 'ArrowRight' && !isLastPage()) {
          event.preventDefault();
          handleNextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, currentCategoryIndex]);

  const handleStartTestClick = () => {
    setShowSecurityInstructions(true);
  };

  const handleSecurityInstructionsAccept = () => {
    setShowSecurityInstructions(false);
    setShowConfirmation(true);
  };

  const handleConfirmStart = () => {
    setShowConfirmation(false);
    startTest();
    // Fullscreen monitoring will automatically start via useEffect when isRunning becomes true
  };

  const handleCancelStart = () => {
    setShowConfirmation(false);
  };

  // Pagination helper functions
  const getCurrentCategory = () => {
    if (!test) return null;
    return test.categories[currentCategoryIndex];
  };

  const getCurrentQuestions = () => {
    const category = getCurrentCategory();
    if (!category) return [];
    
    const startIndex = currentPage * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    return category.questions.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const category = getCurrentCategory();
    if (!category) return 0;
    return Math.ceil(category.questions.length / QUESTIONS_PER_PAGE);
  };

  const getQuestionNumber = (questionIndex: number) => {
    return (currentPage * QUESTIONS_PER_PAGE) + questionIndex + 1;
  };

  const getTotalQuestionsInCategory = () => {
    const category = getCurrentCategory();
    return category ? category.questions.length : 0;
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage + 1 < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      // Move to next category
      if (test && currentCategoryIndex + 1 < test.categories.length) {
        setCurrentCategoryIndex(currentCategoryIndex + 1);
        setCurrentPage(0);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      // Move to previous category
      if (currentCategoryIndex > 0) {
        setCurrentCategoryIndex(currentCategoryIndex - 1);
        const prevCategory = test?.categories[currentCategoryIndex - 1];
        if (prevCategory) {
          const prevCategoryTotalPages = Math.ceil(prevCategory.questions.length / QUESTIONS_PER_PAGE);
          setCurrentPage(prevCategoryTotalPages - 1);
        }
      }
    }
  };

  const isFirstPage = () => {
    return currentCategoryIndex === 0 && currentPage === 0;
  };

  const isLastPage = () => {
    if (!test) return false;
    const isLastCategory = currentCategoryIndex === test.categories.length - 1;
    const isLastPageInCategory = currentPage === getTotalPages() - 1;
    return isLastCategory && isLastPageInCategory;
  };

  const Header = ({ testName }: { testName: string; }) => {
    const currentCategory = getCurrentCategory();
    
    return (
      <div className="sticky top-0 bg-white w-full border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-10 py-5 lg:px-0">
          <div>
            <div className="flex gap-4 items-center">
              <button className="flex group">
                <Link href={`/dashboard`} className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 group-hover:fill-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44.952 44.952" fill="currentColor">
                    <g transform="rotate(180 22.476 22.476)">
                      <path d="M44.952 22.108c0-1.25-.478-2.424-1.362-3.308L30.627 5.831a2.5 2.5 0 0 0-3.536 0 2.5 2.5 0 0 0 0 3.546l10.574 10.57H2.484A2.48 2.48 0 0 0 0 22.464v.028a2.48 2.48 0 0 0 2.484 2.523h35.182L27.094 35.579a2.5 2.5 0 0 0 0 3.541 2.5 2.5 0 0 0 3.538-.001l12.958-12.97a4.662 4.662 0 0 0 1.362-3.309v-.732z" />
                    </g>
                  </svg>
                  <span className="group-hover:text-blue-600">
                    Back
                  </span>
                </Link>
              </button>
              <div className="-space-y-1">
                <h1 className="text-xl lg:text-lg font-semibold font-mono uppercase text-left text-neutral-800">{testName}</h1>
                {test && completedCategories.length === test.categories.length && (<h2 className="text-sm lg:text-xs font-semibold font-sans uppercase text-left text-neutral-800">Final Results</h2>)}
                {currentCategory && (
                  <div className="text-sm text-blue-600">
                    Current: {currentCategory.categoryName} | Page {currentPage + 1} of {getTotalPages()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            {test && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-gray-600">Progress:</span>
                <div className="flex gap-1">
                  {test.categories.map((category, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        index < currentCategoryIndex 
                          ? 'bg-green-500' 
                          : index === currentCategoryIndex 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                      }`}
                      title={category.categoryName}
                    />
                  ))}
                </div>
              </div>
            )}
            {slug && <CountdownTimer slug={slug as string} isRunning={isRunning} onComplete={endTest} />}
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="text-center mt-5 h-screen">
      <Loader size="large" message="Loading assessment..." />
    </div>
  );
  
  if (error) return (
    <div className="text-center text-red-500 mt-5 h-screen">
      <div className="flex flex-col items-center gap-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
  
  if (!student) return (
    <div className="text-center mt-5 h-screen">
      <Loader size="large" message="Loading student data..." />
    </div>
  );
  
  if (!test) return (
    <div className="text-center mt-5 h-screen">
      <div className="flex flex-col items-center gap-4">
        <p>Test not found</p>
        <Link href="/assessment" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Assessments
        </Link>
      </div>
    </div>
  );

  // Check if student has already completed this test
  const currentAssignedTest = studentInfo?.assignedTests.find(
    (assignedTest) => assignedTest.testId === test._id
  );

  // If test is completed, show a message and redirect option
  if (currentAssignedTest?.status === 'completed' && !testCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-20">
        <Head>
          <title>{`${test.testName} - Already Completed`}</title>
        </Head>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            Test Already Completed
          </h1>
          <p className="text-gray-600 mb-6">
            You have already completed the "{test.testName}" assessment. 
            Re-attempts are not allowed.
          </p>
          <div className="space-y-3">
            <Link
              href={`/assessment/${test._id}`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              View Your Results
            </Link>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted && !isRunning) {
    const totalCorrect = test.categories.reduce((total, category) => {
      const categoryScore = calculateCategoryStats(category.categoryName).score;
      const assignedTestMarks = studentInfo?.assignedTests.find(
        (assignedTest) => assignedTest.testId === test._id
      )?.marks[category.categoryName] || 0;
      console.log(test._id);
      console.log(assignedTestMarks);
      console.log(studentInfo?.assignedTests);

      return total + categoryScore + assignedTestMarks;
    }, 0) || 0;

    const totalQuestions = test.categories.reduce((total, category) => total + category.questions.length, 0);

    const overallPercentage = Math.round((totalCorrect / totalQuestions) * 100);

    return (
      <div className="">
        <Head>
          <title>{`${test.testName}`}</title>
        </Head>
        <Header testName={test.testName} />
        <div className={`mb-3 -mx-3 h-28 w-[100%+12px] ${overallPercentage >= 80 ? "bg-green-500/30" : "bg-red-500/30"}`}>
          <div className="flex lg:flex-col gap-2 items-center lg:items-start justify-between w-full max-w-6xl mx-auto p-6 lg:p-3">
            <div>
              <div className="text-3xl font-sans font-medium">Your grade: <span className={`font-semibold font-mono tracking-wide ${overallPercentage >= 80 ? "text-green-600" : "text-red-600"}`}>{overallPercentage}%</span></div>
            </div>
            {/* <div>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all">
                Retry Assessment
              </button>
            </div> */}
          </div>
        </div>
        <div className="min-h-screen w-full max-w-6xl mx-auto p-6 lg:p-0">
          <div className="">

            <h1 className="text-3xl font-semibold font-mono uppercase text-left text-neutral-800">{test.testName}</h1>
            <h2 className="text-xl font-semibold font-mono uppercase text-left text-neutral-800">Final Results</h2>


            <div className="mt-6">
              <RankCard studentId={student._id} test={test} /> {/* Insert your rank data prop here */}
            </div>

            <div className="mt-6 space-y-10 font-sans">
              {test.categories.map((category) => (
                <div key={category.categoryName}>
                  <h2 className="text-3xl font-semibold font-mono uppercase text-left text-neutral-800 mb-2">{category.categoryName} - Review</h2>
                  {category.questions.map((question) => {
                    const selected = selectedAnswers[category.categoryName]?.[question._id]?.answer;
                    const isCorrect = selected === question.correctAnswer;

                    return (
                      <div key={question._id} className="p-4 border rounded-lg mb-4 bg-white shadow-sm">
                        <h3 className="font-semibold text-neutral-800">{question.question}</h3>
                        <ul className="mt-2 space-y-2">
                          {question.options.map((option, idx) => {
                            const isUserAnswer = selected === option;
                            const isCorrectAnswer = question.correctAnswer === option;

                            return (
                              <li key={idx}>
                                <div
                                  className={`px-3 py-2 rounded border 
                                    ${isCorrectAnswer ? 'bg-green-100 border-green-600 text-green-800' : ''}
                                    ${isUserAnswer && !isCorrect ? 'bg-red-100 border-red-600 text-red-800' : ''}
                                  `}
                                >
                                  {option}
                                  {isCorrectAnswer ? " (Correct Answer)" : ""}
                                  {isUserAnswer && !isCorrect ? " (Your Answer)" : ""}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isRunning) {
    // Check if test is already completed before showing start form
    const currentAssignedTest = studentInfo?.assignedTests.find(
      (assignedTest) => assignedTest.testId === test._id
    );

    if (currentAssignedTest?.status === 'completed') {
      return (
        <div>
          <Head>
            <title>{`${test.testName} - Already Completed`}</title>
          </Head>
          <Header testName={test.testName} />
          <div className="flex flex-col items-center justify-center mt-10 space-y-6 max-w-md mx-auto">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              Test Already Completed
            </h2>
            <p className="text-gray-600 text-center">
              You have already completed this assessment. Re-attempts are not allowed.
            </p>
            <div className="space-x-4">
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Head>
          <title>{`${test.testName}`}</title>
        </Head>
        <Header testName={test.testName} />
        <div className="flex flex-col items-center justify-center mt-10 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md text-center">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Important:</strong> Once you start this test, you cannot retake it. Make sure you're ready before proceeding.
            </p>
          </div>
          
          <input
            type="text"
            name="rollNo"
            placeholder="Roll Number"
            value={student.rollno}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-64"
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={student.name}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-64"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={student.email}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-64"
          />
          <button
            onClick={handleStartTestClick}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader size="small" />}
            {submitting ? 'Starting...' : 'Start Test (No Retakes Allowed)'}
          </button>
        </div>
        
        <TestStartConfirmation
          testName={test.testName}
          isOpen={showConfirmation}
          onConfirm={handleConfirmStart}
          onCancel={handleCancelStart}
        />
        
        {showSecurityInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
              <TestSecurityInstructions
                testName={test.testName}
                onStartTest={handleSecurityInstructionsAccept}
                maxWarnings={3}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <LoadingOverlay 
        isLoading={submitting} 
        message={submitting && isRunning ? "Starting test..." : "Submitting test..."} 
      />
      <Head>
        <title>{`${test.testName}`}</title>
      </Head>
      <Header testName={test.testName} />
      
      {/* Security Indicator */}
      {isRunning && (
        <TestSecurityIndicator
          securityStatus={securityStatus}
          warningCount={warningCount}
          remainingWarnings={remainingWarnings}
          isVisible={true}
        />
      )}
      
      <div className="min-h-screen w-full max-w-6xl mx-auto p-6 lg:px-0">
        {(() => {
          const currentCategory = getCurrentCategory();
          const currentQuestions = getCurrentQuestions();
          const totalPages = getTotalPages();
          
          if (!currentCategory || currentQuestions.length === 0) {
            return <div className="text-center">No questions available</div>;
          }

          return (
            <div className="flex flex-col gap-6 lg:gap-3 font-sans">
              {/* Overall Progress Indicator */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Test Progress</h3>
                  <span className="text-sm text-gray-600">
                    {test.categories.reduce((total, category) => {
                      return total + category.questions.filter(q => 
                        selectedAnswers[category.categoryName]?.[q._id]?.submitted
                      ).length;
                    }, 0)} / {test.categories.reduce((total, category) => total + category.questions.length, 0)} questions answered
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(test.categories.reduce((total, category) => {
                        return total + category.questions.filter(q => 
                          selectedAnswers[category.categoryName]?.[q._id]?.submitted
                        ).length;
                      }, 0) / test.categories.reduce((total, category) => total + category.questions.length, 0)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Category Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-2xl font-semibold font-mono uppercase text-center text-blue-800">
                  {currentCategory.categoryName}
                </h2>
                <div className="text-center text-sm text-blue-600 mt-2">
                  Page {currentPage + 1} of {totalPages} | 
                  Questions {(currentPage * QUESTIONS_PER_PAGE) + 1} - {Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, getTotalQuestionsInCategory())} of {getTotalQuestionsInCategory()}
                </div>
              </div>

              {/* Questions */}
              {currentQuestions.map((question, questionIndex) => {
                const isSubmitted = selectedAnswers[currentCategory.categoryName]?.[question._id]?.submitted || false;
                const selectedOption = selectedAnswers[currentCategory.categoryName]?.[question._id]?.answer;
                const questionNumber = getQuestionNumber(questionIndex);

                return (
                  <div key={question._id} className="p-5 mb-6 lg:mb-4 py-7 bg-white border-l-4 shadow-md border-blue-500">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 text-blue-800 font-bold text-sm px-3 py-1 rounded-full min-w-[40px] text-center">
                        {questionNumber}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-neutral-800 mb-3">{question.question}</h3>
                        <ul className="space-y-3 text-sm font-[540]">
                          {question.options.map((option, index) => (
                            <li key={index}>
                              <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-200 transition-all
                                    ${selectedOption === option ? "bg-blue-200 text-blue-500 border-blue-500" : "bg-neutral-100 text-neutral-700"}
                                `}>
                                <input
                                  type="radio"
                                  name={`question-${question._id}`}
                                  value={option}
                                  checked={selectedOption === option}
                                  onChange={() => handleAnswerSelect(currentCategory.categoryName, question._id, option)}
                                  disabled={isSubmitted}
                                  className="form-radio text-blue-600"
                                />
                                <span className="">{option}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleQuestionSubmit(currentCategory.categoryName, question._id)}
                          className={`mt-4 px-3 py-1.5 rounded border transition-all ${!isSubmitted ? "bg-blue-200 text-blue-700 hover:bg-blue-300 border-blue-500" : "bg-red-200 border-red-500 text-red-700"}`}
                          disabled={selectedOption == null || selectedOption === ""}
                        >
                          {isSubmitted ? "Clear Answer" : "Save Answer"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 mb-6">
                <button
                  onClick={handlePreviousPage}
                  disabled={isFirstPage()}
                  className={`px-6 py-2 font-sans text-sm tracking-wider font-medium uppercase rounded border transition-all
                    ${isFirstPage() 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
                    }`}
                >
                  ← Previous
                </button>

                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    Category {currentCategoryIndex + 1} of {test.categories.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentCategory.categoryName}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Use Ctrl+← → for navigation
                  </div>
                </div>                {isLastPage() ? (
                  <button 
                    onClick={() => {
                      // Calculate answered questions for confirmation
                      const totalQuestions = test.categories.reduce((total, category) => total + category.questions.length, 0);
                      const answeredQuestions = test.categories.reduce((total, category) => {
                        return total + category.questions.filter(q => 
                          selectedAnswers[category.categoryName]?.[q._id]?.submitted
                        ).length;
                      }, 0);
                      
                      const confirmMessage = `Are you sure you want to submit the test?\n\nAnswered: ${answeredQuestions}/${totalQuestions} questions\nUnanswered questions will be marked as incorrect.\n\nThis action cannot be undone.`;
                      
                      showConfirmModal(
                        "Submit Test",
                        confirmMessage,
                        () => {
                          handleSubmit();
                        },
                        () => {
                          // Do nothing on cancel
                        },
                        "Submit Test",
                        "Cancel"
                      );
                    }} 
                    disabled={submitting}
                    className={`px-6 py-2 font-sans text-sm tracking-wider font-medium uppercase rounded border transition-all
                      ${submitting 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-400' 
                        : 'bg-green-600 text-white hover:bg-green-700 border-green-600'
                      }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextPage}
                    className="px-6 py-2 font-sans text-sm tracking-wider font-medium uppercase rounded border bg-blue-600 text-white hover:bg-blue-700 transition-all"
                  >
                    Next →
                  </button>
                )}
              </div>

              {/* Category Overview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  {test.categories.map((category, index) => {
                    const isCurrentCategory = index === currentCategoryIndex;
                    const categoryQuestions = category.questions.length;
                    const answeredQuestions = category.questions.filter(q => 
                      selectedAnswers[category.categoryName]?.[q._id]?.submitted
                    ).length;
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 text-xs rounded border ${
                          isCurrentCategory 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="font-medium">{category.categoryName}</div>
                        <div className="text-xs">
                          {answeredQuestions}/{categoryQuestions} answered
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
export default AssessmentSlug;
