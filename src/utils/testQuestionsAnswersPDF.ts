// Test script to generate sample PDF with questions
import { generateReportPDF } from '@/utils/pdfGenerator';

// Sample data for testing the questions feature
const testQuestionsAndAnswers = async () => {
  const sampleStudent = {
    _id: "test123",
    name: "Sidharth Kumar",
    rollno: "19121A05K9",
    email: "sidharth@vignan.ac.in",
    year: 3,
    branch: "Computer Science & Engineering",
    section: "A",
    semester: 6,
    assignedTests: []
  };

  const sampleTest = {
    _id: "testid123",
    testName: "Data Structures and Algorithms - Assessment with Questions",
    categories: [
      {
        _id: "cat1",
        categoryName: "Data Structures",
        questions: [
          {
            _id: "q1",
            question: "What is the time complexity of inserting an element at the beginning of an array?",
            options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
            correctAnswer: "O(n)"
          },
          {
            _id: "q2",
            question: "Which data structure follows the Last In First Out (LIFO) principle?",
            options: ["Queue", "Stack", "Linked List", "Tree"],
            correctAnswer: "Stack"
          },
          {
            _id: "q3",
            question: "What is the worst-case time complexity of searching in a binary search tree?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            correctAnswer: "O(n)"
          }
        ]
      },
      {
        _id: "cat2",
        categoryName: "Algorithms",
        questions: [
          {
            _id: "q4",
            question: "Which sorting algorithm has the best average-case time complexity?",
            options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
            correctAnswer: "Merge Sort"
          },
          {
            _id: "q5",
            question: "What is the space complexity of the merge sort algorithm?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            correctAnswer: "O(n)"
          }
        ]
      }
    ],
    __v: 0
  };

  const sampleAssignedTest = {
    _id: "assigned123",
    testId: "testid123",
    status: "completed" as const,
    marks: {
      "Data Structures": 2,
      "Algorithms": 1
    },
    start: "2024-03-15T10:00:00Z",
    submittedAt: "2024-03-15T12:15:00Z"
  };

  // Calculate totals
  let totalMarks = 0;
  let obtainedMarks = 0;

  sampleTest.categories.forEach((category) => {
    const categoryMarks = (sampleAssignedTest.marks as any)[category.categoryName] || 0;
    obtainedMarks += categoryMarks;
    totalMarks += category.questions.length;
  });

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  console.log('Generating test PDF with questions and answers:');
  console.log('Total Questions:', totalMarks);
  console.log('Correct Answers:', obtainedMarks);
  console.log('Percentage:', percentage.toFixed(2) + '%');

  try {
    await generateReportPDF({
      student: sampleStudent,
      test: sampleTest,
      assignedTest: sampleAssignedTest,
      obtainedMarks,
      totalMarks,
      percentage
    });
    
    console.log('✅ PDF with questions generated successfully! Check your downloads folder.');
    alert('PDF with questions generated successfully! Check your downloads folder for the report.');
    return true;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    alert('Error generating PDF. Check console for details.');
    return false;
  }
};

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).testQuestionsAndAnswers = testQuestionsAndAnswers;
  console.log('Test function available as window.testQuestionsAndAnswers()');
}

export { testQuestionsAndAnswers };
