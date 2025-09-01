import { useRouter } from "next/router";
import React, { useState } from "react";
import { useAuth } from "@/components/Hooks/useAuth";
import Head from "next/head";
import { useNotification } from "@/components/context/NotificationContext";
import Loader from "@/components/Elements/Loader";

interface LoginFormData {
  rollno: string;
  year: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    rollno: "",
    year: "",
    password: "",
  });

  const { showNotification } = useNotification();

  const { login, loading } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderInput = (
    label: string,
    type: string,
    name: keyof LoginFormData,
    placeholder: string
  ) => (
    <div className="w-full">
      <label htmlFor={name} className="block font-medium">{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required
        placeholder={placeholder}
        className="w-full p-2 border rounded-md"
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const { rollno, year, password } = formData;
  
    if (!rollno || !year || !password) {
      showNotification("All fields are required!", "error");
      return;
    }
  
    const normalizedRollno = rollno.toUpperCase();
  
    const { error } = await login({ ...formData, rollno: normalizedRollno });
  
    if (error) {
      showNotification(error, "error");
      return;
    }
  
    router.push("/dashboard");
  };
  

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Head><title>Login | Assessment Student Portal</title></Head>
      <div className="w-full max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-semibold font-mono uppercase text-center mb-6 text-gray-800">
          Student Login
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {renderInput("Reg No", "text", "rollno", "Enter registration number")}
          {renderInput("Graduating Year", "number", "year", "Enter year")}
          {renderInput("Password", "password", "password", "Enter password")}

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader size="small" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register here
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
