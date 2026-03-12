import React, { useEffect, useState, createContext, useContext } from 'react';
export interface Student {
  id: string;
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  course: string;
  feesPaid: number;
  totalFees: number;
  pendingDays: number;
  eligibleForExams: boolean;
  status: string;
  enrollmentDate: string;
  password?: string;
  needsPasswordReset?: boolean;
  documents?: {
    passportPhoto?: string;
    idCard?: string;
    pdl?: string;
  };
}
const INITIAL_STUDENTS: Student[] = [
{
  id: 'LASH-2026-1001',
  name: 'John Doe',
  idNumber: '12345678',
  email: 'john@example.com',
  phone: '0712345678',
  course: 'Category B (Cars)',
  feesPaid: 16000,
  totalFees: 16000,
  pendingDays: 0,
  eligibleForExams: true,
  status: 'Active',
  enrollmentDate: '2026-01-15',
  password: 'password123',
  needsPasswordReset: false
},
{
  id: 'LASH-2026-1002',
  name: 'Jane Smith',
  idNumber: '87654321',
  email: 'jane@example.com',
  phone: '0723456789',
  course: 'Category A (Motorcycles)',
  feesPaid: 6000,
  totalFees: 12000,
  pendingDays: 14,
  eligibleForExams: false,
  status: 'Active',
  enrollmentDate: '2026-02-01',
  password: 'password123',
  needsPasswordReset: false
},
{
  id: 'LASH-2026-1003',
  name: 'Michael Johnson',
  idNumber: '11223344',
  email: 'michael@example.com',
  phone: '0734567890',
  course: 'Category C (Light Commercial)',
  feesPaid: 19000,
  totalFees: 19000,
  pendingDays: 2,
  eligibleForExams: true,
  status: 'Active',
  enrollmentDate: '2026-01-10',
  password: 'password123',
  needsPasswordReset: false
},
{
  id: 'LASH-2026-1004',
  name: 'Sarah Williams',
  idNumber: '44332211',
  email: 'sarah@example.com',
  phone: '0745678901',
  course: 'Microsoft Office Suite',
  feesPaid: 4000,
  totalFees: 8000,
  pendingDays: 21,
  eligibleForExams: false,
  status: 'Active',
  enrollmentDate: '2026-02-15',
  password: 'password123',
  needsPasswordReset: false
}];

interface StudentContextType {
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  currentStudent: Student | null;
  loginStudent: (id: string, student: Student) => void;
  logoutStudent: () => void;
}
const StudentContext = createContext<StudentContextType | undefined>(undefined);
export function StudentProvider({ children }: {children: React.ReactNode;}) {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('lashawn_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(
    () => {
      return localStorage.getItem('lashawn_current_student');
    }
  );
  useEffect(() => {
    localStorage.setItem('lashawn_students', JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    if (currentStudentId) {
      localStorage.setItem('lashawn_current_student', currentStudentId);
    } else {
      localStorage.removeItem('lashawn_current_student');
    }
  }, [currentStudentId]);
  const addStudent = (student: Student) => {
    setStudents((prev) => [student, ...prev]);
  };
  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
    prev.map((s) =>
    s.id === id ?
    {
      ...s,
      ...data
    } :
    s
    )
    );
  };
  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };
  const loginStudent = (id: string) => {
    setCurrentStudentId(id);
  };
  const logoutStudent = () => {
    setCurrentStudentId(null);
  };
  const currentStudent = students.find((s) => s.id === currentStudentId) || null;
  return (
    <StudentContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        currentStudent,
        loginStudent,
        logoutStudent
      }}>
      
      {children}
    </StudentContext.Provider>);

}
export function useStudentContext() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
}