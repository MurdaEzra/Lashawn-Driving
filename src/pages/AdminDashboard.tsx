import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Trash2
} from "lucide-react";
import { supabase } from "../contexts/supabaseClient";

export function AdminDashboard() {

  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [roadSigns, setRoadSigns] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  // 🔐 CHECK AUTH
  useEffect(() => {

    const checkAdmin = async () => {

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        navigate("/admin/login");
        return;
      }

      loadData();

    };

    checkAdmin();

  }, []);

  // 📥 LOAD DATA FROM SUPABASE
  const loadData = async () => {

    setLoading(true);

    const { data: studentsData } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: feesData } = await supabase
      .from("fees")
      .select("*");

    const { data: signsData } = await supabase
      .from("road_signs")
      .select("*");

    if (studentsData) setStudents(studentsData);
    if (feesData) setFees(feesData);
    if (signsData) setRoadSigns(signsData);

    setLoading(false);

  };

  // 🚪 LOGOUT
  const handleLogout = async () => {

    await supabase.auth.signOut();

    navigate("/admin/login");

  };

  // 💰 MARK FEES PAID
  const markFullyPaid = async (student: any) => {

    await supabase
      .from("students")
      .update({
        fees_paid: student.total_fees
      })
      .eq("id", student.id);

    loadData();

  };

  // 🎓 TOGGLE ELIGIBILITY
  const toggleEligibility = async (student: any) => {

    await supabase
      .from("students")
      .update({
        eligible_for_exams: !student.eligible_for_exams
      })
      .eq("id", student.id);

    loadData();

  };

  // ❌ DELETE STUDENT
  const deleteStudent = async (id: string) => {

    if (!confirm("Delete this student?")) return;

    await supabase
      .from("students")
      .delete()
      .eq("id", id);

    loadData();

  };

  // 📊 STATS
  const totalStudents = students.length;

  const totalRevenue = students.reduce(
    (sum, s) => sum + s.fees_paid,
    0
  );

  const pendingFees = students.reduce(
    (sum, s) => sum + (s.total_fees - s.fees_paid),
    0
  );

  const eligibleStudents = students.filter(
    s => s.eligible_for_exams
  ).length;

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading dashboard...
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <div className="bg-gray-900 text-white p-4 flex justify-between">

        <h1 className="text-xl font-bold">
          Lashawn Admin Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut size={18}/>
          Logout
        </button>

      </div>

      <div className="p-6">

        {/* STATS */}

        <div className="grid grid-cols-4 gap-4 mb-8">

          <div className="bg-white p-4 rounded shadow">
            <Users/>
            <p>Total Students</p>
            <h2>{totalStudents}</h2>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <CheckCircle/>
            <p>Eligible Students</p>
            <h2>{eligibleStudents}</h2>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <p>Total Revenue</p>
            <h2>KSh {totalRevenue}</h2>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <Clock/>
            <p>Pending Fees</p>
            <h2>KSh {pendingFees}</h2>
          </div>

        </div>

        {/* STUDENTS TABLE */}

        <div className="bg-white rounded shadow overflow-hidden">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-3 text-left">Name</th>
                <th>Course</th>
                <th>Fees</th>
                <th>Eligibility</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {students.map((student) => {

                const fullyPaid =
                  student.fees_paid === student.total_fees;

                return (

                  <tr key={student.id} className="border-t">

                    <td className="p-3">
                      {student.name}
                    </td>

                    <td>{student.course}</td>

                    <td>

                      {student.fees_paid} / {student.total_fees}

                      {!fullyPaid && (

                        <button
                          onClick={() => markFullyPaid(student)}
                          className="ml-3 text-green-600"
                        >
                          Mark Paid
                        </button>

                      )}

                    </td>

                    <td>

                      {student.eligible_for_exams
                        ? <span className="text-green-600">Eligible</span>
                        : <span className="text-red-600">Not Eligible</span>
                      }

                    </td>

                    <td className="flex gap-3">

                      <button
                        onClick={() => toggleEligibility(student)}
                        className="text-blue-600"
                      >
                        Toggle
                      </button>

                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={16}/>
                      </button>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}