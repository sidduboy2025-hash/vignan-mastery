import React from 'react';

interface TestStartConfirmationProps {
  testName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const TestStartConfirmation: React.FC<TestStartConfirmationProps> = ({
  testName,
  onConfirm,
  onCancel,
  isOpen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Start Assessment?
          </h2>
          <p className="text-gray-600 mb-4">
            You are about to start "<strong>{testName}</strong>".
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
            <p className="text-red-800 text-sm font-medium">
              <strong>⚠️ Important:</strong> Once you start this test, you cannot retake it. 
              Make sure you have a stable internet connection and enough time to complete it.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              I Understand, Start Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestStartConfirmation;
