import React, { useEffect } from 'react';
import { useModal } from '../context/ModalContext';

const CustomModal: React.FC = () => {
  const { modals, hideModal } = useModal();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (modals.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modals.length]);

  if (modals.length === 0) return null;

  const currentModal = modals[modals.length - 1]; // Show the topmost modal

  const handleConfirm = () => {
    if (currentModal.onConfirm) {
      currentModal.onConfirm();
    }
    hideModal(currentModal.id);
  };

  const handleCancel = () => {
    if (currentModal.onCancel) {
      currentModal.onCancel();
    }
    hideModal(currentModal.id);
  };

  const getModalStyles = () => {
    switch (currentModal.type) {
      case 'success':
        return {
          iconColor: 'text-green-600',
          icon: '✓',
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50',
          confirmButtonColor: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'error':
        return {
          iconColor: 'text-red-600',
          icon: '✕',
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
          confirmButtonColor: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          icon: '⚠',
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50',
          confirmButtonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        };
      case 'confirm':
        return {
          iconColor: 'text-blue-600',
          icon: '?',
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
          confirmButtonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      default:
        return {
          iconColor: 'text-gray-600',
          icon: 'i',
          borderColor: 'border-gray-500',
          bgColor: 'bg-gray-50',
          confirmButtonColor: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
    }
  };

  const styles = getModalStyles();

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={currentModal.type === 'confirm' ? undefined : handleCancel}
        style={{ zIndex: 999998 }}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${styles.bgColor} ${styles.borderColor} border-2`}
        style={{ zIndex: 999999 }}
      >
        <div className="p-6">
          {/* Icon */}
          <div className={`text-4xl ${styles.iconColor} text-center mb-4`}>
            {styles.icon}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-3">
            {currentModal.title}
          </h3>
          
          {/* Message */}
          <div className="text-gray-700 text-center mb-6 whitespace-pre-line">
            {currentModal.message}
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            {currentModal.type === 'confirm' ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors font-medium"
                >
                  {currentModal.cancelButtonText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 rounded transition-colors font-medium ${styles.confirmButtonColor}`}
                >
                  {currentModal.confirmButtonText || 'Confirm'}
                </button>
              </>
            ) : (
              <button
                onClick={handleConfirm}
                className={`px-6 py-2 rounded transition-colors font-medium ${styles.confirmButtonColor}`}
              >
                {currentModal.confirmButtonText || 'OK'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
