import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Lock, User, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useStudentContext } from '../contexts/StudentContext';
export function StudentLogin() {
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { students, loginStudent } = useStudentContext();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const student = students.find((s) => s.id === regNumber);
      if (student && student.password === password) {
        loginStudent(student.id);
        navigate('/student/dashboard');
      } else {
        setError('Invalid Registration Number or Password.');
        setIsLoading(false);
      }
    }, 1000);
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-[#2E8B57] p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <User className="text-white h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Student Portal</h2>
          <p className="text-green-100 text-sm mt-1">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="p-8">
          {error &&
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start text-sm">
              <ShieldAlert className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          }

          <form onSubmit={handleLogin} className="space-y-6">
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
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none transition-colors uppercase"
                  placeholder="LASH-2026-XXXX" />
                
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none transition-colors"
                  placeholder="Enter password" />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  
                  {showPassword ?
                  <EyeOff className="h-5 w-5" /> :

                  <Eye className="h-5 w-5" />
                  }
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}>
              
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Demo: LASH-2026-1001 / password123</p>
          </div>
        </div>
      </div>
    </div>);

}