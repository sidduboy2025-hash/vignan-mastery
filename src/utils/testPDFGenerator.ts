// Test script for the PDF generator
// Add this to your dashboard component or run in browser console

import { generateReportPDF } from '@/utils/pdfGenerator';

const testPDF = async () => {
  // Sample data to test the PDF layout
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
    testName: "Data Structures and Algorithms - Mid Term Assessment 2024",
    categories: [
      {
        _id: "cat1",
        categoryName: "Data Structures & Arrays",
        questions: Array(15).fill(null).map((_, i) => ({
          _id: `q${i+1}`,
          question: `Question ${i+1}`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "A"
        }))
      },
      {
        _id: "cat2", 
        categoryName: "Linked Lists & Stacks",
        questions: Array(12).fill(null).map((_, i) => ({
          _id: `q${i+16}`,
          question: `Question ${i+16}`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "B"
        }))
      },
      {
        _id: "cat3",
        categoryName: "Trees & Graph Algorithms", 
        questions: Array(18).fill(null).map((_, i) => ({
          _id: `q${i+28}`,
          question: `Question ${i+28}`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "C"
        }))
      },
      {
        _id: "cat4",
        categoryName: "Dynamic Programming & Greedy",
        questions: Array(10).fill(null).map((_, i) => ({
          _id: `q${i+46}`,
          question: `Question ${i+46}`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "D"
        }))
      },
      {
        _id: "cat5",
        categoryName: "Sorting & Searching Algorithms",
        questions: Array(8).fill(null).map((_, i) => ({
          _id: `q${i+56}`,
          question: `Question ${i+56}`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "A"
        }))
      }
    ],
    __v: 0
  };

  const sampleAssignedTest = {
    _id: "assigned123",
    testId: "testid123",
    status: "completed",
    marks: {
      "Data Structures & Arrays": 12,
      "Linked Lists & Stacks": 9,
      "Trees & Graph Algorithms": 14,
      "Dynamic Programming & Greedy": 7,
      "Sorting & Searching Algorithms": 6
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

  console.log('Generating test PDF with the following data:');
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
    
    console.log('✅ PDF generated successfully! Check your downloads folder.');
    alert('PDF generated successfully! Check your downloads folder for the report.');
    return true;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    alert('Error generating PDF. Check console for details.');
    return false;
  }
};

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).testPDF = testPDF;
  console.log('Test function available as window.testPDF()');
}

export { testPDF };
