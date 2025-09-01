import React from 'react';
import Loader from './Loader';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Loading...', 
  className = '' 
}) => {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <Loader size="large" message={message} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
