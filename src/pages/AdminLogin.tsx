import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Lock, Mail, ShieldAlert, Chrome, Eye, EyeOff } from 'lucide-react';
export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      if (email === 'admin@lashawn.co.ke' && password === 'admin123') {
        localStorage.setItem('adminAuth', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid email or password.');
        setIsLoading(false);
      }
    }, 1000);
  };
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError('');
    // Simulate Google OAuth
    setTimeout(() => {
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin/dashboard');
    }, 1500);
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-[#2E8B57] h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
          <p className="text-gray-400 text-sm mt-1">
            Sign in to manage students
          </p>
        </div>
        <div className="p-8">
          {error &&
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start text-sm">
              <ShieldAlert className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          }
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 mb-6">
            
            <Chrome className="h-5 w-5 text-blue-500" />
            Continue with Google
          </button>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-500">
                or sign in with email
              </span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none transition-colors"
                  placeholder="admin@lashawn.co.ke" />
                
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
              className="w-full bg-[#2E8B57] hover:bg-[#267349]"
              disabled={isLoading}>
              
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Demo: admin@lashawn.co.ke / admin123</p>
          </div>
        </div>
      </div>
    </div>);

}