import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '../contexts/supabaseClient';
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
  tempPassword?: string; // For students who haven't set a password yet
  documents?: {
    passportPhoto?: string;
    idCard?: string;
    pdl?: string;
  };
}
// No mock students — rely on Supabase as the source of truth.

interface StudentContextType {
  students: Student[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  currentStudent: Student | null;
  loginStudent: (id: string, student: Student) => void;
  logoutStudent: () => void;
}
const StudentContext = createContext<StudentContextType | undefined>(undefined);
export function StudentProvider({ children }: {children: React.ReactNode;}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(
    () => {
      return localStorage.getItem('lashawn_current_student');
    }
  );

  // Load students from Supabase on mount; fallback to localStorage/empty
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase load error:', error);
          const saved = localStorage.getItem('lashawn_students');
          setStudents(saved ? JSON.parse(saved) : []);
        } else {
          // Map DB rows to local Student shape
          const mapped = (data || []).map((r: any) => ({
            id: r.registration_number || r.id,
            name: r.name,
            idNumber: r.id_number || r.idNumber || '',
            email: r.email,
            phone: r.phone || '',
            course: r.course || '',
            feesPaid: r.fees_paid || 0,
            totalFees: r.total_fees || 0,
            pendingDays: r.pending_days || 0,
            eligibleForExams: r.eligible_for_exams || false,
            // If DB stores a boolean `status`, convert to UI string. Otherwise use stored string.
            status: (typeof r.status === 'boolean') ? (r.status ? 'Active' : 'Pending Payment') : (r.status || 'Active'),
            enrollmentDate: r.enrollment_date || r.enrollmentDate || '',
            needsPasswordReset: r.needs_password_reset || false,
            documents: r.documents || {}
          }));

          setStudents(mapped.length ? mapped : []);
        }
      } catch (err) {
        console.error('Load students failed:', err);
        const saved = localStorage.getItem('lashawn_students');
        setStudents(saved ? JSON.parse(saved) : []);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Persist to localStorage as a cache
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('lashawn_students', JSON.stringify(students));
    }
  }, [students, loading]);
  const addStudent = async (student: Student) => {
    // Persist to Supabase first
    try {
      const payload: any = {
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
        enrollment_date: student.enrollmentDate || undefined,
        documents: student.documents || undefined
      };

      const { error } = await supabase.from('students').insert(payload);
      if (error) {
        console.error('Failed to insert student to Supabase:', error);
        // still update local UI so user sees record, but warn
        setStudents((prev) => [student, ...prev]);
        return;
      }

      setStudents((prev) => [student, ...prev]);
    } catch (err) {
      console.error('addStudent error:', err);
      setStudents((prev) => [student, ...prev]);
    }
  };
  const updateStudent = async (id: string, data: Partial<Student>) => {
    // For non-privileged fields we can update via the client anon key.
    // Privileged fields (feesPaid, totalFees, status, eligibleForExams) must be updated via the server admin endpoint.
    try {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.idNumber !== undefined) payload.id_number = data.idNumber;
      if (data.email !== undefined) payload.email = data.email;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.course !== undefined) payload.course = data.course;
      const adminPayload: any = {};
      if (data.feesPaid !== undefined) adminPayload.fees_paid = data.feesPaid;
      if (data.totalFees !== undefined) adminPayload.total_fees = data.totalFees;
      if (data.eligibleForExams !== undefined) adminPayload.eligible_for_exams = data.eligibleForExams;
      if (data.status !== undefined) adminPayload.status = data.status;
      if (data.enrollmentDate !== undefined) payload.enrollment_date = data.enrollmentDate;
      if (data.documents !== undefined) payload.documents = data.documents;

      // Client-side update for non-privileged fields
      if (Object.keys(payload).length > 0) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('registration_number', id);

        if (error) {
          console.error('Failed to update student in Supabase (client):', error);
        }
      }

      // If there are privileged fields, send them to the server admin endpoint
      if (Object.keys(adminPayload).length > 0) {
        try {
          const resp = await fetch('/api/admin/update-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registration_number: id, update: adminPayload })
          });

          if (!resp.ok) {
            console.error('Admin update failed:', await resp.text());
          }
        } catch (e) {
          console.error('Admin update request failed:', e);
        }
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s))
      );
    } catch (err) {
      console.error('updateStudent error:', err);
    }
  };
  const deleteStudent = async (id: string) => {
    try {
      // Deletion is privileged — call the server admin endpoint which uses the service role key.
      const resp = await fetch('/api/admin/delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number: id })
      });

      if (!resp.ok) {
        console.error('Admin delete failed:', await resp.text());
      }
    } catch (err) {
      console.error('deleteStudent error:', err);
    } finally {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
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