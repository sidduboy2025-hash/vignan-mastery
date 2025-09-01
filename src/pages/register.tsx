import { API_BASE_URL } from "@/utils";
import Head from "next/head";
import React, { useState } from "react";
import Loader from "@/components/Elements/Loader";
// import { useRouter } from "next/router";

interface StudentFormData {
    rollno: string;
    email: string;
    password: string;
    name: string;
    year: number | "";
    branch: string;
    section: string;
    semester: number | "";
}

const branches = [
    "CSE",
    "CSE-AI",
    "CSE-DS",
    "CSE-CS",
    "AIDS",
    "ECE",
    "EEE",
    "ECM",
    "MECH",
    "CIVIL",
    "IT",
] as const;

const sections = ["1", "2", "3", "4" , "5" , "6" , "7" , "8"] as const;
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 9 }, (_, i) => currentYear + 4 - i);
const semesters = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const StudentForm: React.FC = () => {
    const [formData, setFormData] = useState<StudentFormData>({
        rollno: "",
        email: "",
        password: "",
        name: "",
        year: "",
        branch: "",
        section: "",
        semester: "",
    });

    const [loading, setLoading] = useState(false);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "year" || name === "semester" ? Number(value) || "" : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form data
        if (!formData.rollno || !formData.email || !formData.password || !formData.name) {
            alert('All fields are required!');
            return;
        }

        setLoading(true);

        try {
            // Register a new student
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Registration failed");
            }

            const data = await response.json();
            alert("Registration successful!");

            // Optionally: You can now proceed to login, or navigate to another page
        } catch (error: any) {
            console.error("Error during registration:", error);
            if (error.response) {
                console.error("Response error:", await error.response.text()); // Log response body
            }
            alert("Registration failed, please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <Head><title>Register | Assessment Student Portal</title></Head>
            <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
                <h1 className="text-2xl font-semibold font-mono uppercase text-center mb-6 text-gray-800">
                    Student Exam Form
                </h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-1 gap-6">
                    <div className="w-full">
                        <label className="block font-medium">Reg No</label>
                        <input
                            type="text"
                            name="rollno"
                            value={formData.rollno}
                            onChange={handleChange}
                            required
                            placeholder="Enter registration number"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter email address"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter password"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your name"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Graduating Year</label>
                        <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Year</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Branch</label>
                        <select
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Branch</option>
                            {branches.map((branch) => (
                                <option key={branch} value={branch}>
                                    {branch}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Section</label>
                        <select
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Section</option>
                            {sections.map((section) => (
                                <option key={section} value={section}>
                                    {section}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full">
                        <label className="block font-medium">Semester</label>
                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Semester</option>
                            {semesters.map((semester) => (
                                <option key={semester} value={semester}>
                                    {semester}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4 col-span-2 md:col-span-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader size="small" />}
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <span className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Login here
                        </a>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StudentForm;
