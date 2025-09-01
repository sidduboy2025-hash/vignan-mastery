import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
};

const typeStyles = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

const Notification = ({ message, type = "info", duration = 3000, onClose }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-28 right-4 z-50 text-white px-4 py-3 rounded-xl shadow-xl ${typeStyles[type]}`}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
