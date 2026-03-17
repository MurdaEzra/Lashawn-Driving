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
  needsPasswordReset?: boolean;
  tempPassword?: string;
  documents?: {
    passportPhoto?: string;
    idCard?: string;
    pdl?: string;
  };
}

interface StudentContextType {
  students: Student[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  currentStudent: Student | null;
  loginStudent: (id: string) => void;
  logoutStudent: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// 🔥 IMPORTANT: your backend URL
const API_BASE = 'https://lashawn-backend.onrender.com';

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentStudentId, setCurrentStudentId] = useState<string | null>(
    () => localStorage.getItem('lashawn_current_student')
  );

  // ✅ LOAD STUDENTS FROM BACKEND (NOT SUPABASE)
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/students`);
        const data = await res.json();

        const mapped = (data || []).map((r: any) => ({
          id: r.registration_number || r.id,
          name: r.name,
          idNumber: r.id_number || '',
          email: r.email,
          phone: r.phone || '',
          course: r.course || '',
          feesPaid: r.fees_paid || 0,
          totalFees: r.total_fees || 0,
          pendingDays: r.pending_days || 0,
          eligibleForExams: r.eligible_for_exams || false,
          status:
            typeof r.status === 'boolean'
              ? r.status
                ? 'Active'
                : 'Pending Payment'
              : r.status || 'Active',
          enrollmentDate: r.enrollment_date || '',
          needsPasswordReset: r.needs_password_reset || false,
          documents: r.documents || {},
        }));

        setStudents(mapped);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // ✅ CACHE LOCALLY
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('lashawn_students', JSON.stringify(students));
    }
  }, [students, loading]);

  // ✅ ADD STUDENT (BACKEND ONLY)
  const addStudent = async (student: Student) => {
    try {
      const payload = {
        registration_number: student.id,
        name: student.name,
        id_number: student.idNumber,
        email: student.email,
        phone: student.phone,
        course: student.course,
        fees_paid: student.feesPaid || 0,
        total_fees: student.totalFees || 0,
        eligible_for_exams: student.eligibleForExams || false,
        status: student.status || 'Active',
        enrollment_date: student.enrollmentDate,
        documents: student.documents,
      };

      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Insert failed:', data);
        return;
      }

      setStudents((prev) => [student, ...prev]);
    } catch (err) {
      console.error('addStudent error:', err);
    }
  };

  // ✅ UPDATE STUDENT (BACKEND ONLY)
  const updateStudent = async (id: string, data: Partial<Student>) => {
    try {
      const payload: any = {};

      if (data.name) payload.name = data.name;
      if (data.idNumber) payload.id_number = data.idNumber;
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      if (data.course) payload.course = data.course;
      if (data.feesPaid !== undefined) payload.fees_paid = data.feesPaid;
      if (data.totalFees !== undefined) payload.total_fees = data.totalFees;
      if (data.eligibleForExams !== undefined)
        payload.eligible_for_exams = data.eligibleForExams;
      if (data.status !== undefined) payload.status = data.status;
      if (data.enrollmentDate) payload.enrollment_date = data.enrollmentDate;
      if (data.documents) payload.documents = data.documents;

      const res = await fetch(`${API_BASE}/api/update-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: id,
          update: payload,
        }),
      });

      if (!res.ok) {
        console.error('Update failed');
        return;
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s))
      );
    } catch (err) {
      console.error('updateStudent error:', err);
    }
  };

  // ✅ DELETE STUDENT (BACKEND ONLY)
  const deleteStudent = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/delete-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number: id }),
      });

      if (!res.ok) {
        console.error('Delete failed');
        return;
      }

      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('deleteStudent error:', err);
    }
  };

  const loginStudent = (id: string) => {
    setCurrentStudentId(id);
    localStorage.setItem('lashawn_current_student', id);
  };

  const logoutStudent = () => {
    setCurrentStudentId(null);
    localStorage.removeItem('lashawn_current_student');
  };

  const currentStudent =
    students.find((s) => s.id === currentStudentId) || null;

  return (
    <StudentContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        currentStudent,
        loginStudent,
        logoutStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudentContext() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudentContext must be used within StudentProvider');
  }
  return context;
}