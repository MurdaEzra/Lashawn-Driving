import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Lock, User, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { supabase } from "../contexts/supabaseClient";

export function StudentLogin() {

  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {

      // 1️⃣ Find student email using registration number
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("email")
        .eq("registration_number", regNumber)
        .single();

      if (studentError || !student) {
        setError("Invalid Registration Number.");
        setIsLoading(false);
        return;
      }

      // 2️⃣ Login using Supabase Auth
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: student.email,
        password: password,
      });

      if (loginError) {
        setError("Invalid password.");
        setIsLoading(false);
        return;
      }

      // 3️⃣ Redirect to dashboard
      navigate("/student/dashboard");

    } catch (err) {

      setError("Something went wrong. Please try again.");
      setIsLoading(false);

    }
  };

  const handleResetPassword = async () => {

    if (!regNumber) {
      setError("Enter your registration number first.");
      return;
    }

    try {

      const { data: student } = await supabase
        .from("students")
        .select("email")
        .eq("registration_number", regNumber)
        .single();

      if (!student) {
        setError("Student not found.");
        return;
      }

      await supabase.auth.resetPasswordForEmail(student.email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      alert("Password reset link sent to your email.");

    } catch (error) {
      setError("Could not send reset email.");
    }
  };

  return (

    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

        {/* Header */}

        <div className="bg-[#2E8B57] p-6 text-center">

          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <User className="text-white h-6 w-6" />
          </div>

          <h2 className="text-2xl font-bold text-white">
            Student Portal
          </h2>

          <p className="text-green-100 text-sm mt-1">
            Sign in to access your dashboard
          </p>

        </div>

        <div className="p-8">

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start text-sm">
              <ShieldAlert className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Registration Number */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) =>
                    setRegNumber(e.target.value.toUpperCase())
                  }
                  required
                  placeholder="LASH-2026-XXXX"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none uppercase"
                />

              </div>

            </div>

            {/* Password */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >

                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}

                </button>

              </div>

            </div>

            {/* Login Button */}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >

              {isLoading ? "Authenticating..." : "Sign In"}

            </Button>

          </form>

          {/* Reset Password */}

          <div className="mt-6 text-center">

            <button
              onClick={handleResetPassword}
              className="text-sm text-[#2E8B57] hover:underline"
            >
              Forgot password?
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}