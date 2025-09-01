export interface ObjectId {
    $oid: string;
}

export interface Question {
    _id: string;
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface Category {
    _id: string;
    categoryName: string;
    questions: Question[];
}

export interface Test {
    _id: string;
    testName: string;
    categories: Category[];
    __v: number;
}

interface AssignedTestPending {
    _id: string;
    testId: string;
    marks: Record<string, number>;
    status: 'pending';
    start: string | null;
    submittedAt: string | null;
}

interface AssignedTestInProgress {
    _id: string;
    testId: string;
    start: string | null;
    status: 'in-progress';
    marks: Record<string, number>;
    submittedAt: string | null;
}

interface AssignedTestCompleted {
    _id: string;
    testId: string;
    status: 'completed';
    marks: Record<string, number>;
    start: string | null;
    submittedAt: string | null;
}

type AssignedTest = AssignedTestPending | AssignedTestInProgress | AssignedTestCompleted;

export interface Student {
    _id: string;
    name: string;
    rollno: string;
    year: number;
    branch: string;
    section: string;
    email: string;
    semester: number;
    assignedTests: AssignedTest[];
} 
