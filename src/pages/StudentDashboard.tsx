import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../contexts/supabaseClient";

import {
  LogOut,
  Upload,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";

export function StudentDashboard() {

  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const passportRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const pdlRef = useRef<HTMLInputElement>(null);

  // LOAD STUDENT DATA
  useEffect(() => {

    const loadStudent = async () => {

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        navigate("/student/login");
        return;
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setStudent(studentData);
      setLoading(false);

    };

    loadStudent();

  }, []);

  // LOGOUT
  const logout = async () => {

    await supabase.auth.signOut();
    navigate("/student/login");

  };

  // PASSWORD RESET
  const resetPassword = async (password: string) => {

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      alert("Password update failed");
      return;
    }

    alert("Password updated");

  };

  // UPLOAD DOCUMENT
  const uploadDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "passport" | "id" | "pdl"
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    const user = await supabase.auth.getUser();

    const filePath = `${type}/${user.data.user?.id}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("student-documents")
      .upload(filePath, file);

    if (error) {
      alert("Upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("student-documents")
      .getPublicUrl(filePath);

    const column =
      type === "passport"
        ? "passport_photo"
        : type === "id"
        ? "id_card"
        : "pdl";

    await supabase
      .from("students")
      .update({ [column]: data.publicUrl })
      .eq("id", student.id);

    setStudent({
      ...student,
      [column]: data.publicUrl
    });

  };

  // REMOVE DOCUMENT
  const removeDocument = async (column: string) => {

    await supabase
      .from("students")
      .update({ [column]: null })
      .eq("id", student.id);

    setStudent({
      ...student,
      [column]: null
    });

  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!student) return null;

  const balance = student.total_fees - student.fees_paid;
  const fullyPaid = balance <= 0;

  const hasDocs =
    student.passport_photo &&
    student.id_card &&
    student.pdl;

  return (

    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <div className="bg-[#2E8B57] text-white p-4 flex justify-between">

        <div>

          <h1 className="text-lg font-bold">
            Student Portal
          </h1>

          <p className="text-xs">
            {student.name}
          </p>

        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2"
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

      <div className="p-6 space-y-6">

        {/* COURSE */}

        <div className="bg-white p-5 rounded shadow">

          <h2 className="font-bold mb-2">
            Course
          </h2>

          <p>{student.course}</p>

        </div>

        {/* FEES */}

        <div className="bg-white p-5 rounded shadow">

          <h2 className="font-bold mb-2">
            Fees
          </h2>

          <p>
            Paid: KSh {student.fees_paid}
          </p>

          <p>
            Total: KSh {student.total_fees}
          </p>

          {!fullyPaid && (

            <p className="text-red-600">
              Balance: KSh {balance}
            </p>

          )}

        </div>

        {/* EXAM STATUS */}

        <div className="bg-white p-5 rounded shadow">

          <h2 className="font-bold mb-2">
            Exam Eligibility
          </h2>

          {student.eligible_for_exams ? (

            <div className="text-green-600 flex items-center gap-2">

              <CheckCircle size={18} />

              Eligible

            </div>

          ) : (

            <div className="text-red-600 flex items-center gap-2">

              <XCircle size={18} />

              Not Eligible

            </div>

          )}

        </div>

        {/* DOCUMENTS */}

        <div className="bg-white p-5 rounded shadow">

          <h2 className="font-bold mb-4">
            Upload Documents
          </h2>

          {/* PASSPORT */}

          <div className="flex items-center justify-between mb-3">

            <span>Passport Photo</span>

            {student.passport_photo ? (

              <div className="flex gap-2">

                <img
                  src={student.passport_photo}
                  className="w-12 h-12 object-cover"
                />

                <button
                  onClick={() =>
                    removeDocument("passport_photo")
                  }
                >

                  <Trash2 size={16} />

                </button>

              </div>

            ) : (

              <>
                <input
                  type="file"
                  ref={passportRef}
                  className="hidden"
                  onChange={(e) =>
                    uploadDocument(e, "passport")
                  }
                />

                <button
                  onClick={() =>
                    passportRef.current?.click()
                  }
                >
                  <Upload size={18} />
                </button>
              </>

            )}

          </div>

          {/* ID */}

          <div className="flex items-center justify-between mb-3">

            <span>ID Card</span>

            {student.id_card ? (

              <button
                onClick={() =>
                  removeDocument("id_card")
                }
              >
                <Trash2 size={16}/>
              </button>

            ) : (

              <>
                <input
                  type="file"
                  ref={idRef}
                  className="hidden"
                  onChange={(e) =>
                    uploadDocument(e, "id")
                  }
                />

                <button
                  onClick={() =>
                    idRef.current?.click()
                  }
                >
                  <Upload size={18}/>
                </button>
              </>

            )}

          </div>

          {/* PDL */}

          <div className="flex items-center justify-between">

            <span>PDL</span>

            {student.pdl ? (

              <button
                onClick={() =>
                  removeDocument("pdl")
                }
              >
                <Trash2 size={16}/>
              </button>

            ) : (

              <>
                <input
                  type="file"
                  ref={pdlRef}
                  className="hidden"
                  onChange={(e) =>
                    uploadDocument(e, "pdl")
                  }
                />

                <button
                  onClick={() =>
                    pdlRef.current?.click()
                  }
                >
                  <Upload size={18}/>
                </button>
              </>

            )}

          </div>

        </div>

        {/* EXAM FORM */}

        {student.eligible_for_exams && hasDocs && fullyPaid && (

          <div className="bg-green-50 border border-green-200 p-6 rounded">

            <h2 className="font-bold text-green-700 mb-2">
              Ready for Exam
            </h2>

            <p>
              You can now generate your NTSA exam form.
            </p>

            <button
              className="mt-4 bg-[#2E8B57] text-white px-4 py-2 rounded"
              onClick={() => window.print()}
            >
              Print Exam Form
            </button>

          </div>

        )}

      </div>

    </div>

  );

}