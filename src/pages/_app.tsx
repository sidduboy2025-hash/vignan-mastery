import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Header from "@/components/Navigations/Header";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { NotificationProvider } from "@/components/context/NotificationContext";
import { ModalProvider } from "@/components/context/ModalContext";
import CustomModal from "@/components/Elements/CustomModal";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const isAssessmentPath = router.asPath.startsWith("/assessment/");
    setShowHeader(!isAssessmentPath);
  }, [router.asPath]);

  return (
    <ModalProvider>
      <div>
          {showHeader && <Header />}
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
          <CustomModal />
      </div>
    </ModalProvider>
  );
}
