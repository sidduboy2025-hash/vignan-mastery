import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Modal {
  id: string;
  type: 'success' | 'error' | 'warning' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

interface ModalContextType {
  modals: Modal[];
  showModal: (modal: Omit<Modal, 'id'>) => void;
  hideModal: (id: string) => void;
  hideAllModals: () => void;
  showConfirmModal: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmButtonText?: string,
    cancelButtonText?: string
  ) => void;
  showSuccessModal: (title: string, message: string, onConfirm?: () => void) => void;
  showErrorModal: (title: string, message: string, onConfirm?: () => void) => void;
  showWarningModal: (title: string, message: string, onConfirm?: () => void) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<Modal[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showModal = (modalData: Omit<Modal, 'id'>) => {
    const modal: Modal = {
      ...modalData,
      id: generateId(),
    };
    setModals(prev => [...prev, modal]);
  };

  const hideModal = (id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  };

  const hideAllModals = () => {
    setModals([]);
  };

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel'
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel,
      confirmButtonText,
      cancelButtonText,
    });
  };

  const showSuccessModal = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      onConfirm,
      confirmButtonText: 'OK',
    });
  };

  const showErrorModal = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      onConfirm,
      confirmButtonText: 'OK',
    });
  };

  const showWarningModal = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      onConfirm,
      confirmButtonText: 'OK',
    });
  };

  return (
    <ModalContext.Provider
      value={{
        modals,
        showModal,
        hideModal,
        hideAllModals,
        showConfirmModal,
        showSuccessModal,
        showErrorModal,
        showWarningModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
