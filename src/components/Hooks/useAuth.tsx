import { useCallback, useState } from "react";
import { API_BASE_URL } from "@/utils";
import { useRouter } from "next/router";

interface LoginFormData {
  rollno: string;
  password: string;
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (formData: LoginFormData) => {
    if (!formData.rollno || !formData.password) {
      return { error: "Roll number and password are required." };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.message || "Login failed";
        setError(errorMsg);
        return { error: errorMsg };
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("student", JSON.stringify(result.student));
      window.dispatchEvent(new Event("authChange"));
      router.push("/dashboard");

      return { success: true };
    } catch (err) {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      return { error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    window.dispatchEvent(new Event("authChange"));
    router.push("/login");
  }, [router]);

  return { login, logout, loading, error };
}
