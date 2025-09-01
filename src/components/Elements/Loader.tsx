import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  className = '',
  fullScreen = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 border-2';
      case 'large':
        return 'w-12 h-12 border-4';
      default:
        return 'w-8 h-8 border-3';
    }
  };

  const getContainerClasses = () => {
    if (fullScreen) {
      return 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    }
    return 'flex flex-col items-center justify-center p-4';
  };

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      <div className={`${fullScreen ? 'bg-white p-6 rounded-lg shadow-lg' : ''}`}>
        <div className="flex flex-col items-center gap-3">
          <div
            className={`${getSizeClasses()} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
          ></div>
          {message && (
            <p className="text-gray-600 text-sm font-medium">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Loader;
