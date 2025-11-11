import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Test, Student } from '@/types';
import { API_BASE_URL } from '@/utils';

interface GenerateReportPDFParams {
  student: Student;
  test: Test;
  assignedTest: any;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
}

interface StudentWithScore {
  _id: string;
  rollno: string;
  name: string;
  email: string;
  year: number;
  branch: string;
  section: string;
  semester: number;
  totalScore: number;
  timeTaken: number;
  timeLimit: number;
  completedOnTime: boolean;
}

interface StudentWithRank extends StudentWithScore {
  rank: number;
}

interface RankingData {
  overallRank: number;
  yearRank: number;
  branchRank: number;
  sectionRank: number;
  totalStudents: number;
  yearStudents: number;
  branchStudents: number;
  sectionStudents: number;
}

// Function to calculate rankings
const calculateRankings = async (student: Student, test: Test, assignedTest: any): Promise<RankingData> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students`);
    const allStudents: Student[] = await res.json();

    const attempted: StudentWithScore[] = allStudents
      .map((s) => {
        const studentTest = s.assignedTests.find(
          (t) => t.testId === test._id && t.status === "completed"
        );
        if (!studentTest) return null;

        const totalScore = Object.values(studentTest.marks || {}).reduce(
          (acc, val) => acc + val,
          0
        );

        const start = new Date(studentTest.start || '').getTime();
        const submittedAt = studentTest.submittedAt ? new Date(studentTest.submittedAt).getTime() : 0;
        const timeLimit = 30 * 60 * 1000; // 30 minutes in milliseconds
        const timeTaken = submittedAt - start;

        return {
          ...s,
          totalScore,
          timeTaken,
          timeLimit,
          completedOnTime: timeTaken <= timeLimit
        };
      })
      .filter(Boolean) as StudentWithScore[];

    // Sort by total score descending, then by time taken ascending
    const sorted = attempted.sort((a, b) => b.totalScore - a.totalScore || a.timeTaken - b.timeTaken);
    
    // Calculate overall rank
    const overallRank = sorted.findIndex(s => s._id === student._id) + 1;
    
    // Calculate year rank
    const yearStudents = sorted.filter(s => s.year === student.year);
    const yearRank = yearStudents.findIndex(s => s._id === student._id) + 1;
    
    // Calculate branch rank
    const branchStudents = sorted.filter(s => s.branch === student.branch);
    const branchRank = branchStudents.findIndex(s => s._id === student._id) + 1;
    
    // Calculate section rank
    const sectionStudents = sorted.filter(s => s.year === student.year && s.branch === student.branch && s.section === student.section);
    const sectionRank = sectionStudents.findIndex(s => s._id === student._id) + 1;

    return {
      overallRank,
      yearRank,
      branchRank,
      sectionRank,
      totalStudents: sorted.length,
      yearStudents: yearStudents.length,
      branchStudents: branchStudents.length,
      sectionStudents: sectionStudents.length
    };
  } catch (error) {
    console.error('Error calculating rankings:', error);
    return {
      overallRank: 0,
      yearRank: 0,
      branchRank: 0,
      sectionRank: 0,
      totalStudents: 0,
      yearStudents: 0,
      branchStudents: 0,
      sectionStudents: 0
    };
  }
};

// Function to load and convert image to base64
const loadImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Not in browser environment'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Try to load the image
    img.src = imagePath;
    
    // Set a timeout to prevent hanging
    setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 5000);
  });
};

// Helper function to check if we need a new page
const checkPageSpace = (pdf: jsPDF, currentY: number, requiredSpace: number): number => {
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  
  if (currentY + requiredSpace > pageHeight - 30) {
    pdf.addPage();
    return margin;
  }
  return currentY;
};

// Helper function to add footer to current page
const addFooter = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const footerY = pageHeight - 15;
  
  pdf.setDrawColor(0, 51, 102);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(108, 117, 125);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, margin, footerY);
  pdf.text('Assessment Portal - VIIT', pageWidth - margin, footerY, { align: 'right' });
};

export const generateReportPDF = async ({
  student,
  test,
  assignedTest,
  obtainedMarks,
  totalMarks,
  percentage
}: GenerateReportPDFParams) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Set up the document
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  try {
    // Calculate rankings with fallback
    let rankingData: RankingData;
    try {
      rankingData = await calculateRankings(student, test, assignedTest);
      console.log('Rankings calculated successfully:', rankingData);
    } catch (error) {
      console.warn('Could not calculate rankings:', error);
      // Fallback ranking data
      rankingData = {
        overallRank: 1,
        yearRank: 1,
        branchRank: 1,
        sectionRank: 1,
        totalStudents: 1,
        yearStudents: 1,
        branchStudents: 1,
        sectionStudents: 1
      };
    }

    // Load college logo with fallback
    let logoBase64 = '';
    try {
      logoBase64 = await loadImageAsBase64('/assets/images/vignan-logo.png');
      console.log('Logo loaded successfully');
    } catch (error) {
      console.warn('Could not load college logo:', error);
      // Continue without logo
    }

    // ===== PAGE 1: HEADER AND BASIC INFO =====
    
    // Header with college branding
    if (logoBase64) {
      pdf.addImage(logoBase64, 'PNG', margin, yPosition, 25, 25);
    }
    
    // College name and details
    pdf.setTextColor(0, 51, 102); // Dark blue
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text("VIGNAN'S INSTITUTE OF INFORMATION TECHNOLOGY", pageWidth / 2, yPosition + 12, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('(Autonomous)', pageWidth / 2, yPosition + 18, { align: 'center' });
    pdf.text('Visakhapatnam, Andhra Pradesh', pageWidth / 2, yPosition + 23, { align: 'center' });
    
    yPosition += 35;

    // Title with decorative line
    pdf.setDrawColor(0, 51, 102);
    pdf.setLineWidth(1);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    pdf.setTextColor(220, 53, 69); // Red
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSESSMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    pdf.setDrawColor(0, 51, 102);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 20;

    // Student Information Card
    pdf.setFillColor(240, 248, 255); // Light blue background
    pdf.setDrawColor(0, 123, 255); // Blue border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 50, 3, 3, 'FD');
    
    yPosition += 10;
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STUDENT INFORMATION', margin + 5, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Two columns for student info
    const leftCol = margin + 5;
    const rightCol = pageWidth / 2 + 5;
    
    pdf.text(`Name: ${student.name}`, leftCol, yPosition);
    pdf.text(`Registration Number: ${student.rollno}`, rightCol, yPosition);
    yPosition += 7;
    
    pdf.text(`Email: ${student.email}`, leftCol, yPosition);
    pdf.text(`Academic Year: ${student.year}`, rightCol, yPosition);
    yPosition += 7;
    
    pdf.text(`Branch: ${student.branch}`, leftCol, yPosition);
    pdf.text(`Section: ${student.section}`, rightCol, yPosition);
    yPosition += 7;
    
    pdf.text(`Semester: ${student.semester}`, leftCol, yPosition);
    yPosition += 20;

    // Test Information Card
    yPosition = checkPageSpace(pdf, yPosition, 40);
    
    pdf.setFillColor(248, 249, 250); // Light gray background
    pdf.setDrawColor(108, 117, 125); // Gray border
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 3, 3, 'FD');
    
    yPosition += 10;
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TEST INFORMATION', margin + 5, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    pdf.text(`Test Name: ${test.testName}`, leftCol, yPosition);
    pdf.text(`Status: ${assignedTest.status.toUpperCase()}`, rightCol, yPosition);
    yPosition += 7;
    
    pdf.text(`Completion Date: ${new Date(assignedTest.submittedAt || assignedTest.start).toLocaleDateString('en-IN')}`, leftCol, yPosition);
    pdf.text(`Categories: ${test.categories.length}`, rightCol, yPosition);
    yPosition += 20;

    // Performance Summary Card
    yPosition = checkPageSpace(pdf, yPosition, 55);
    
    pdf.setFillColor(220, 248, 198); // Light green background
    pdf.setDrawColor(40, 167, 69); // Green border
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 55, 3, 3, 'FD');
    
    yPosition += 10;
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE SUMMARY', margin + 5, yPosition);
    yPosition += 10;

    // Grade calculation
    let grade = 'F';
    let gradeColor: [number, number, number] = [220, 53, 69]; // Red
    if (percentage >= 90) {
      grade = 'A+';
      gradeColor = [25, 135, 84]; // Green
    } else if (percentage >= 80) {
      grade = 'A';
      gradeColor = [25, 135, 84]; // Green
    } else if (percentage >= 70) {
      grade = 'B';
      gradeColor = [255, 193, 7]; // Yellow
    } else if (percentage >= 60) {
      grade = 'C';
      gradeColor = [255, 193, 7]; // Yellow
    } else if (percentage >= 50) {
      grade = 'D';
      gradeColor = [253, 126, 20]; // Orange
    }

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    pdf.text(`Total Score: ${obtainedMarks}/${totalMarks}`, leftCol, yPosition);
    pdf.text(`Percentage: ${percentage.toFixed(2)}%`, rightCol, yPosition);
    yPosition += 7;
    
    pdf.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`Grade: ${grade}`, leftCol, yPosition);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const timeTaken = Math.round((new Date(assignedTest.submittedAt || assignedTest.start).getTime() - new Date(assignedTest.start).getTime()) / (1000 * 60));
    pdf.text(`Time Taken: ${timeTaken} minutes`, rightCol, yPosition);
    yPosition += 20;

    // Rankings Card
    yPosition = checkPageSpace(pdf, yPosition, 40);
    
    pdf.setFillColor(255, 243, 205); // Light orange background
    pdf.setDrawColor(255, 193, 7); // Orange border
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 3, 3, 'FD');
    
    yPosition += 10;
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RANKING DETAILS', margin + 5, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    pdf.text(`Overall Rank: ${rankingData.overallRank}/${rankingData.totalStudents}`, leftCol, yPosition);
    pdf.text(`Year Rank: ${rankingData.yearRank}/${rankingData.yearStudents}`, rightCol, yPosition);
    yPosition += 7;
    
    pdf.text(`Branch Rank: ${rankingData.branchRank}/${rankingData.branchStudents}`, leftCol, yPosition);
    pdf.text(`Section Rank: ${rankingData.sectionRank}/${rankingData.sectionStudents}`, rightCol, yPosition);
    yPosition += 20;

    // Add footer to first page
    addFooter(pdf);

    // ===== PAGE 2: CATEGORY-WISE PERFORMANCE =====
    
    // Check if we need a new page for the table
    yPosition = checkPageSpace(pdf, yPosition, 60);
    
    // If we're on a new page, add some top margin
    if (yPosition === margin) {
      yPosition += 10;
    }

    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CATEGORY-WISE PERFORMANCE ANALYSIS', margin, yPosition);
    yPosition += 15;

    // Prepare table data
    const tableData = test.categories.map((category) => {
      const categoryMarks = assignedTest.marks[category.categoryName] || 0;
      const categoryTotal = category.questions.length;
      const categoryPercentage = categoryTotal > 0 ? (categoryMarks / categoryTotal) * 100 : 0;
      
      let categoryGrade = 'F';
      if (categoryPercentage >= 90) categoryGrade = 'A+';
      else if (categoryPercentage >= 80) categoryGrade = 'A';
      else if (categoryPercentage >= 70) categoryGrade = 'B';
      else if (categoryPercentage >= 60) categoryGrade = 'C';
      else if (categoryPercentage >= 50) categoryGrade = 'D';
      
      return [
        category.categoryName,
        `${categoryMarks}`,
        `${categoryTotal}`,
        `${categoryPercentage.toFixed(1)}%`,
        categoryGrade
      ];
    });

    // Generate table with error handling
    let finalY = yPosition + 50;
    try {
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Category', 'Obtained', 'Total', 'Percentage', 'Grade']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: function() {
          addFooter(pdf);
        }
      });

      // Get final Y position after table
      finalY = (pdf as any).lastAutoTable.finalY || yPosition + 50;
      console.log('Table generated successfully');
    } catch (error) {
      console.warn('Could not generate table, using fallback:', error);
      // Fallback: Generate simple text-based table
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      tableData.forEach((row, index) => {
        const rowY = yPosition + (index * 8);
        pdf.text(row[0], margin, rowY);
        pdf.text(row[1], margin + 80, rowY);
        pdf.text(row[2], margin + 105, rowY);
        pdf.text(row[3], margin + 130, rowY);
        pdf.text(row[4], margin + 160, rowY);
      });
      finalY = yPosition + (tableData.length * 8) + 10;
    }
    
    // Add performance analysis text
    let analysisY = finalY + 20;
    analysisY = checkPageSpace(pdf, analysisY, 60);
    
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE ANALYSIS', margin, analysisY);
    analysisY += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Performance summary text
    let performanceText = '';
    if (percentage >= 90) {
      performanceText = 'Excellent performance! You have demonstrated outstanding understanding across all categories.';
    } else if (percentage >= 80) {
      performanceText = 'Very good performance! You have shown strong competency in most areas.';
    } else if (percentage >= 70) {
      performanceText = 'Good performance! There are some areas where you can improve further.';
    } else if (percentage >= 60) {
      performanceText = 'Satisfactory performance. Focus on strengthening weak areas for better results.';
    } else {
      performanceText = 'Needs improvement. Consider additional study and practice in all categories.';
    }
    
    const splitText = pdf.splitTextToSize(performanceText, pageWidth - 2 * margin);
    pdf.text(splitText, margin, analysisY);
    analysisY += splitText.length * 6 + 10;

    // Recommendations
    analysisY = checkPageSpace(pdf, analysisY, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECOMMENDATIONS:', margin, analysisY);
    analysisY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Find weakest categories for recommendations
    const categoryPerformances = test.categories.map((category) => {
      const categoryMarks = assignedTest.marks[category.categoryName] || 0;
      const categoryTotal = category.questions.length;
      const categoryPercentage = categoryTotal > 0 ? (categoryMarks / categoryTotal) * 100 : 0;
      return { name: category.categoryName, percentage: categoryPercentage };
    }).sort((a, b) => a.percentage - b.percentage);

    const weakestCategories = categoryPerformances.slice(0, 2);
    
    weakestCategories.forEach((category, index) => {
      const recommendation = `${index + 1}. Focus on improving ${category.name} (Current: ${category.percentage.toFixed(1)}%)`;
      pdf.text(recommendation, margin, analysisY);
      analysisY += 6;
    });

    if (percentage < 70) {
      pdf.text('3. Consider additional practice sessions and review materials', margin, analysisY);
      analysisY += 6;
      pdf.text('4. Seek guidance from faculty for challenging topics', margin, analysisY);
    }

    // ===== QUESTIONS AND ANSWERS SECTION =====
    analysisY = checkPageSpace(pdf, analysisY, 80);
    
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QUESTIONS & ANSWERS', margin, analysisY);
    analysisY += 15;

    // Add all questions category by category
    let questionNumber = 1;
    test.categories.forEach((category, categoryIndex) => {
      // Category header
      analysisY = checkPageSpace(pdf, analysisY, 30);
      
      pdf.setFillColor(240, 248, 255);
      pdf.setDrawColor(0, 123, 255);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, analysisY - 5, pageWidth - 2 * margin, 20, 2, 2, 'FD');
      
      pdf.setTextColor(0, 51, 102);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${category.categoryName}`, margin + 5, analysisY + 8);
      analysisY += 25;

      // Questions for this category
      category.questions.forEach((question, questionIndex) => {
        // Check if we need a new page
        analysisY = checkPageSpace(pdf, analysisY, 60);
        
        // Question number and text
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Q${questionNumber}.`, margin, analysisY);
        
        // Wrap question text
        const questionText = pdf.splitTextToSize(question.question, pageWidth - 2 * margin - 20);
        pdf.text(questionText, margin + 15, analysisY);
        analysisY += questionText.length * 5 + 8;
        
        // Options
        pdf.setFont('helvetica', 'normal');
        question.options.forEach((option, optionIndex) => {
          const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D
          const isCorrect = option === question.correctAnswer;
          
          // Check space for option
          analysisY = checkPageSpace(pdf, analysisY, 8);
          
          if (isCorrect) {
            // Bold and green for correct answer
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 128, 0); // Green color
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0); // Black color
          }
          
          const optionText = `${optionLabel}) ${option}`;
          const wrappedOption = pdf.splitTextToSize(optionText, pageWidth - 2 * margin - 25);
          pdf.text(wrappedOption, margin + 20, analysisY);
          analysisY += wrappedOption.length * 5 + 3;
        });
        
        analysisY += 5; // Space between questions
        questionNumber++;
      });
      
      analysisY += 10; // Space between categories
    });

    // Add footer to last page if not already added
    addFooter(pdf);

    // Save the PDF
    const fileName = `${student.rollno}_${test.testName.replace(/\s+/g, '_')}_Assessment_Report.pdf`;
    pdf.save(fileName);
    console.log('PDF generated successfully:', fileName);

  } catch (error) {
    console.error('Error generating detailed PDF report:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      studentId: student._id,
      testId: test._id
    });
    
    // Create a new PDF for fallback
    const fallbackPdf = new jsPDF('p', 'mm', 'a4');
    const fallbackPageWidth = fallbackPdf.internal.pageSize.width;
    const fallbackMargin = 20;
    
    fallbackPdf.setFontSize(16);
    fallbackPdf.setFont('helvetica', 'bold');
    fallbackPdf.text('Assessment Report', fallbackPageWidth / 2, 50, { align: 'center' });
    
    fallbackPdf.setFontSize(12);
    fallbackPdf.setFont('helvetica', 'normal');
    fallbackPdf.text(`Student: ${student.name}`, fallbackMargin, 80);
    fallbackPdf.text(`Roll Number: ${student.rollno}`, fallbackMargin, 90);
    fallbackPdf.text(`Test: ${test.testName}`, fallbackMargin, 100);
    fallbackPdf.text(`Score: ${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%)`, fallbackMargin, 110);
    
    // Grade calculation for fallback
    let fallbackGrade = 'F';
    if (percentage >= 90) fallbackGrade = 'A+';
    else if (percentage >= 80) fallbackGrade = 'A';
    else if (percentage >= 70) fallbackGrade = 'B';
    else if (percentage >= 60) fallbackGrade = 'C';
    else if (percentage >= 50) fallbackGrade = 'D';
    
    fallbackPdf.text(`Grade: ${fallbackGrade}`, fallbackMargin, 120);
    
    // Category breakdown
    let fallbackY = 140;
    fallbackPdf.setFont('helvetica', 'bold');
    fallbackPdf.text('Category-wise Performance:', fallbackMargin, fallbackY);
    fallbackY += 10;
    
    fallbackPdf.setFont('helvetica', 'normal');
    test.categories.forEach((category) => {
      const categoryMarks = assignedTest.marks[category.categoryName] || 0;
      const categoryTotal = category.questions.length;
      const categoryPercentage = categoryTotal > 0 ? (categoryMarks / categoryTotal) * 100 : 0;
      
      fallbackPdf.text(`${category.categoryName}: ${categoryMarks}/${categoryTotal} (${categoryPercentage.toFixed(1)}%)`, fallbackMargin, fallbackY);
      fallbackY += 8;
    });
    
    fallbackY += 20;

    // Questions and Answers section for fallback
    const fallbackCheckSpace = (requiredSpace: number) => {
      if (fallbackY + requiredSpace > fallbackPdf.internal.pageSize.height - 40) {
        fallbackPdf.addPage();
        fallbackY = fallbackMargin;
      }
    };

    fallbackCheckSpace(30);
    fallbackPdf.setFont('helvetica', 'bold');
    fallbackPdf.text('QUESTIONS & ANSWERS', fallbackMargin, fallbackY);
    fallbackY += 15;

    let questionNumber = 1;
    test.categories.forEach((category) => {
      fallbackCheckSpace(20);
      
      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.text(`${category.categoryName}`, fallbackMargin, fallbackY);
      fallbackY += 10;

      category.questions.forEach((question) => {
        fallbackCheckSpace(40);
        
        fallbackPdf.setFont('helvetica', 'bold');
        fallbackPdf.text(`Q${questionNumber}.`, fallbackMargin, fallbackY);
        
        const questionText = fallbackPdf.splitTextToSize(question.question, fallbackPageWidth - 2 * fallbackMargin - 15);
        fallbackPdf.text(questionText, fallbackMargin + 15, fallbackY);
        fallbackY += questionText.length * 5 + 5;
        
        fallbackPdf.setFont('helvetica', 'normal');
        question.options.forEach((option, optionIndex) => {
          const optionLabel = String.fromCharCode(65 + optionIndex);
          const isCorrect = option === question.correctAnswer;
          
          fallbackCheckSpace(8);
          
          if (isCorrect) {
            fallbackPdf.setFont('helvetica', 'bold');
          } else {
            fallbackPdf.setFont('helvetica', 'normal');
          }
          
          const optionText = `${optionLabel}) ${option}${isCorrect ? ' ✓' : ''}`;
          const wrappedOption = fallbackPdf.splitTextToSize(optionText, fallbackPageWidth - 2 * fallbackMargin - 20);
          fallbackPdf.text(wrappedOption, fallbackMargin + 15, fallbackY);
          fallbackY += wrappedOption.length * 5 + 2;
        });
        
        fallbackY += 5;
        questionNumber++;
      });
      
      fallbackY += 10;
    });
    
    fallbackPdf.text('Note: Detailed report generation encountered an issue.', fallbackMargin, fallbackY + 20);
    fallbackPdf.text('Please contact support if this problem persists.', fallbackMargin, fallbackY + 30);
    
    const fileName = `${student.rollno}_${test.testName.replace(/\s+/g, '_')}_Basic_Report.pdf`;
    fallbackPdf.save(fileName);
    
    // Re-throw the error so calling code can handle it
    throw error;
  }
};
