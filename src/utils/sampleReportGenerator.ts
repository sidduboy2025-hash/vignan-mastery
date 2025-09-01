import { generateReportPDF } from '@/utils/pdfGenerator';
import { Test, Student } from '@/types';

// Sample data for testing
const sampleStudent: Student = {
  _id: "sample123",
  name: "Sidharth Kumar",
  rollno: "19121A05K9",
  email: "sidharth@vignan.ac.in",
  year: 3,
  branch: "CSE",
  section: "A",
  semester: 6,
  assignedTests: [
    {
      _id: "test123",
      testId: "sample_test_id",
      status: "completed" as const,
      marks: {
        "Data Structures": 8,
        "Algorithms": 7,
        "Database Management": 9,
        "Operating Systems": 6
      },
      start: "2024-03-15T10:00:00Z",
      submittedAt: "2024-03-15T11:45:00Z"
    }
  ]
};

const sampleTest: Test = {
  _id: "sample_test_id",
  testName: "Computer Science Fundamentals - Mid Term Assessment",
  categories: [
    {
      _id: "cat1",
      categoryName: "Data Structures",
      questions: Array(10).fill(null).map((_, i) => ({
        _id: `q${i+1}`,
        question: `Sample question ${i+1}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A"
      }))
    },
    {
      _id: "cat2",
      categoryName: "Algorithms",
      questions: Array(10).fill(null).map((_, i) => ({
        _id: `q${i+11}`,
        question: `Sample question ${i+11}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option B"
      }))
    },
    {
      _id: "cat3",
      categoryName: "Database Management",
      questions: Array(10).fill(null).map((_, i) => ({
        _id: `q${i+21}`,
        question: `Sample question ${i+21}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option C"
      }))
    },
    {
      _id: "cat4",
      categoryName: "Operating Systems",
      questions: Array(10).fill(null).map((_, i) => ({
        _id: `q${i+31}`,
        question: `Sample question ${i+31}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option D"
      }))
    }
  ],
  __v: 0
};

// Function to generate sample PDF report
export const generateSampleReport = async () => {
  const assignedTest = sampleStudent.assignedTests[0];
  
  let totalMarks = 0;
  let obtainedMarks = 0;

  sampleTest.categories.forEach((category) => {
    const categoryMarks = assignedTest.marks[category.categoryName] || 0;
    obtainedMarks += categoryMarks;
    totalMarks += category.questions.length;
  });

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  try {
    await generateReportPDF({
      student: sampleStudent,
      test: sampleTest,
      assignedTest,
      obtainedMarks,
      totalMarks,
      percentage
    });
    
    console.log('Sample PDF report generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating sample PDF:', error);
    return false;
  }
};

// Test function for the browser console
if (typeof window !== 'undefined') {
  (window as any).generateSampleReport = generateSampleReport;
}
