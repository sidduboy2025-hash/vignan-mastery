import React from 'react';
import { Test, Student } from '@/types';

interface TestResultsProps {
  test: Test;
  student: Student;
  assignedTest: any;
}

const TestResults: React.FC<TestResultsProps> = ({ test, student, assignedTest }) => {
  if (assignedTest?.status !== 'completed') {
    return null;
  }

  let totalMarks = 0;
  let obtainedMarks = 0;

  test.categories.forEach((category) => {
    const categoryMarks = assignedTest.marks[category.categoryName] || 0;
    obtainedMarks += categoryMarks;
    totalMarks += category.questions.length;
  });

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Results</h1>
          <h2 className="text-xl text-gray-600">{test.testName}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Score</h3>
            <p className="text-3xl font-bold text-blue-600">{obtainedMarks}/{totalMarks}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Percentage</h3>
            <p className="text-3xl font-bold text-green-600">{percentage.toFixed(2)}%</p>
          </div>
          
          <div className={`p-6 rounded-lg text-center ${
            percentage >= 80 ? 'bg-green-50' : 
            percentage >= 60 ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              percentage >= 80 ? 'text-green-800' : 
              percentage >= 60 ? 'text-yellow-800' : 'text-red-800'
            }`}>Grade</h3>
            <p className={`text-3xl font-bold ${
              percentage >= 80 ? 'text-green-600' : 
              percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : 'C'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Category-wise Performance</h3>
          <div className="space-y-4">
            {test.categories.map((category) => {
              const categoryMarks = assignedTest.marks[category.categoryName] || 0;
              const categoryTotal = category.questions.length;
              const categoryPercentage = categoryTotal > 0 ? (categoryMarks / categoryTotal) * 100 : 0;
              
              return (
                <div key={category._id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">{category.categoryName}</h4>
                    <span className="text-sm text-gray-600">{categoryMarks}/{categoryTotal}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        categoryPercentage >= 80 ? 'bg-green-500' : 
                        categoryPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${categoryPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{categoryPercentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Test completed successfully! You cannot retake this assessment.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Re-attempts are not allowed for this assessment. 
              Your final score has been recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
