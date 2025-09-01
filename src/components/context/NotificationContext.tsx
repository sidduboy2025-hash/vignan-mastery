import { createContext, useContext, useState, ReactNode } from "react";
import Notification from "@/components/Elements/Notification";

type NotificationType = "success" | "error" | "info";

interface NotificationContextValue {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [visible, setVisible] = useState(false);
  const [duration, setDuration] = useState(3000);

  const showNotification = (msg: string, t: NotificationType = "info", d = 3000) => {
    setMessage(msg);
    setType(t);
    setDuration(d);
    setVisible(true);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {visible && (
        <Notification
          message={message}
          type={type}
          duration={duration}
          onClose={() => setVisible(false)}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider");
  return context;
};
