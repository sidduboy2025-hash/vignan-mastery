import jsPDF from 'jspdf';
import { Test, Student } from '@/types';

interface GenerateSimpleReportPDFParams {
  student: Student;
  test: Test;
  assignedTest: any;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
}

export const generateSimpleReportPDF = async ({
  student,
  test,
  assignedTest,
  obtainedMarks,
  totalMarks,
  percentage
}: GenerateSimpleReportPDFParams) => {
  console.log('Starting simple PDF generation...');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  try {
    // Header
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text("VIGNAN'S INSTITUTE OF INFORMATION TECHNOLOGY", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    pdf.setFontSize(16);
    pdf.setTextColor(220, 53, 69);
    pdf.text('ASSESSMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 25;

    // Student Information
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STUDENT INFORMATION', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const studentInfo = [
      `Name: ${student.name}`,
      `Registration Number: ${student.rollno}`,
      `Email: ${student.email}`,
      `Year: ${student.year} | Branch: ${student.branch} | Section: ${student.section}`,
      `Semester: ${student.semester}`
    ];

    studentInfo.forEach((info) => {
      pdf.text(info, margin, yPosition);
      yPosition += 7;
    });

    yPosition += 15;

    // Test Information
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TEST INFORMATION', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Test Name: ${test.testName}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Status: ${assignedTest.status.toUpperCase()}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Completion Date: ${new Date(assignedTest.submittedAt || assignedTest.start).toLocaleDateString('en-IN')}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Categories: ${test.categories.length}`, margin, yPosition);
    yPosition += 20;

    // Performance Summary
    pdf.setFillColor(220, 248, 198);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 45, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE SUMMARY', margin + 5, yPosition + 5);
    yPosition += 15;

    // Grade calculation
    let grade = 'F';
    let gradeColor: [number, number, number] = [220, 53, 69];
    if (percentage >= 90) {
      grade = 'A+';
      gradeColor = [25, 135, 84];
    } else if (percentage >= 80) {
      grade = 'A';
      gradeColor = [25, 135, 84];
    } else if (percentage >= 70) {
      grade = 'B';
      gradeColor = [255, 193, 7];
    } else if (percentage >= 60) {
      grade = 'C';
      gradeColor = [255, 193, 7];
    } else if (percentage >= 50) {
      grade = 'D';
      gradeColor = [253, 126, 20];
    }

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    pdf.text(`Total Score: ${obtainedMarks}/${totalMarks}`, margin + 5, yPosition);
    pdf.text(`Percentage: ${percentage.toFixed(2)}%`, margin + 5, yPosition + 7);
    
    pdf.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`Grade: ${grade}`, margin + 5, yPosition + 14);
    
    yPosition += 35;

    // Category-wise Performance (Simple Text Format)
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CATEGORY-WISE PERFORMANCE', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Headers
    pdf.setFont('helvetica', 'bold');
    pdf.text('Category', margin, yPosition);
    pdf.text('Obtained', margin + 80, yPosition);
    pdf.text('Total', margin + 120, yPosition);
    pdf.text('Percentage', margin + 150, yPosition);
    pdf.text('Grade', margin + 180, yPosition);
    yPosition += 8;
    
    // Draw line under headers
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    test.categories.forEach((category) => {
      const categoryMarks = assignedTest.marks[category.categoryName] || 0;
      const categoryTotal = category.questions.length;
      const categoryPercentage = categoryTotal > 0 ? (categoryMarks / categoryTotal) * 100 : 0;
      
      let categoryGrade = 'F';
      if (categoryPercentage >= 90) categoryGrade = 'A+';
      else if (categoryPercentage >= 80) categoryGrade = 'A';
      else if (categoryPercentage >= 70) categoryGrade = 'B';
      else if (categoryPercentage >= 60) categoryGrade = 'C';
      else if (categoryPercentage >= 50) categoryGrade = 'D';
      
      pdf.text(category.categoryName, margin, yPosition);
      pdf.text(`${categoryMarks}`, margin + 80, yPosition);
      pdf.text(`${categoryTotal}`, margin + 120, yPosition);
      pdf.text(`${categoryPercentage.toFixed(1)}%`, margin + 150, yPosition);
      pdf.text(categoryGrade, margin + 180, yPosition);
      yPosition += 7;
    });

    yPosition += 20;

    // Function to check space and add new page if needed
    const checkSpaceSimple = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pdf.internal.pageSize.height - 40) {
        pdf.addPage();
        yPosition = margin;
      }
    };

    // ===== QUESTIONS AND ANSWERS SECTION =====
    checkSpaceSimple(30);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QUESTIONS & ANSWERS', margin, yPosition);
    yPosition += 15;

    // Add all questions category by category
    let questionNumber = 1;
    test.categories.forEach((category) => {
      checkSpaceSimple(20);
      
      // Category header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${category.categoryName}`, margin, yPosition);
      yPosition += 10;

      // Questions for this category
      category.questions.forEach((question) => {
        checkSpaceSimple(40);
        
        // Question number and text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Q${questionNumber}.`, margin, yPosition);
        
        // Wrap question text
        const questionText = pdf.splitTextToSize(question.question, pageWidth - 2 * margin - 15);
        pdf.text(questionText, margin + 15, yPosition);
        yPosition += questionText.length * 5 + 5;
        
        // Options
        pdf.setFont('helvetica', 'normal');
        question.options.forEach((option, optionIndex) => {
          const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D
          const isCorrect = option === question.correctAnswer;
          
          checkSpaceSimple(8);
          
          if (isCorrect) {
            // Bold for correct answer
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0); // Keep black in simple version
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
          }
          
          const optionText = `${optionLabel}) ${option}${isCorrect ? ' ✓' : ''}`;
          const wrappedOption = pdf.splitTextToSize(optionText, pageWidth - 2 * margin - 20);
          pdf.text(wrappedOption, margin + 15, yPosition);
          yPosition += wrappedOption.length * 5 + 2;
        });
        
        yPosition += 5; // Space between questions
        questionNumber++;
      });
      
      yPosition += 10; // Space between categories
    });

    // Footer
    const footerY = pdf.internal.pageSize.height - 20;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(108, 117, 125);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, margin, footerY);
    pdf.text('Assessment Portal - VIIT', pageWidth - margin, footerY, { align: 'right' });

    // Save the PDF
    const fileName = `${student.rollno}_${test.testName.replace(/\s+/g, '_')}_Simple_Report.pdf`;
    pdf.save(fileName);
    
    console.log('Simple PDF generated successfully:', fileName);
    return true;

  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw error;
  }
};
