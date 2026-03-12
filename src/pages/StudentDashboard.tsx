import React, { useEffect, useState, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentContext } from '../contexts/StudentContext';
import { Button } from '../components/ui/Button';
import {
  LogOut,
  BookOpen,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  AlertTriangle,
  Lock,
  Printer,
  Image as ImageIcon,
  Trash2 } from
'lucide-react';
export function StudentDashboard() {
  const { currentStudent, logoutStudent, updateStudent } = useStudentContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'exam'>(
    'overview'
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  // File input refs
  const passportRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLInputElement>(null);
  const pdlRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!currentStudent) {
      navigate('/student/login');
    }
  }, [currentStudent, navigate]);
  if (!currentStudent) return null;
  const handleLogout = () => {
    logoutStudent();
    navigate('/student/login');
  };
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    updateStudent(currentStudent.id, {
      password: newPassword,
      needsPasswordReset: false
    });
  };
  const handleFileChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  docType: 'passportPhoto' | 'idCard' | 'pdl') =>
  {
    const file = e.target.files?.[0];
    if (!file) return;
    // Ensure it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG)');
      return;
    }
    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    setUploadingDoc(docType);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateStudent(currentStudent.id, {
        documents: {
          ...currentStudent.documents,
          [docType]: base64String
        }
      });
      setUploadingDoc(null);
    };
    reader.readAsDataURL(file);
  };
  const removeDocument = (docType: 'passportPhoto' | 'idCard' | 'pdl') => {
    updateStudent(currentStudent.id, {
      documents: {
        ...currentStudent.documents,
        [docType]: undefined
      }
    });
    // Reset the file input
    if (docType === 'passportPhoto' && passportRef.current)
    passportRef.current.value = '';
    if (docType === 'idCard' && idCardRef.current) idCardRef.current.value = '';
    if (docType === 'pdl' && pdlRef.current) pdlRef.current.value = '';
  };
  const feePercentage =
  currentStudent.feesPaid / currentStudent.totalFees * 100;
  const isFullyPaid = feePercentage === 100;
  const balance = currentStudent.totalFees - currentStudent.feesPaid;
  const hasAllDocs =
  currentStudent.documents?.passportPhoto &&
  currentStudent.documents?.idCard &&
  currentStudent.documents?.pdl;
  // Force password reset view if needed
  if (currentStudent.needsPasswordReset) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-orange-600 h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Update Password
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              For security reasons, please change your default password before
              accessing the portal.
            </p>
          </div>

          {passwordError &&
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
              {passwordError}
            </div>
          }

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] outline-none" />
              
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] outline-none" />
              
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Update Password
            </Button>
          </form>
        </div>
      </div>);

  }
  return (
    <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:pb-0">
      {/* Header - Hidden on Print */}
      <div className="bg-[#2E8B57] text-white shadow-md print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Student Portal</h1>
            <p className="text-xs text-green-100">
              {currentStudent.id} • {currentStudent.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-green-100 hover:text-white transition-colors text-sm font-medium bg-white/10 px-4 py-2 rounded-md hover:bg-white/20">
            
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 print:mt-0 print:px-0">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation - Hidden on Print */}
          <div className="w-full md:w-64 flex-shrink-0 print:hidden">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 text-center">
                {currentStudent.documents?.passportPhoto ?
                <img
                  src={currentStudent.documents.passportPhoto}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-[#2E8B57]" /> :


                <div className="w-20 h-20 bg-[#2E8B57]/10 text-[#2E8B57] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                    {currentStudent.name.charAt(0)}
                  </div>
                }
                <h3 className="font-bold text-gray-900">
                  {currentStudent.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  {currentStudent.status}
                </span>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-[#2E8B57]/10 text-[#2E8B57]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  
                  <BookOpen className="h-5 w-5 mr-3" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'documents' ? 'bg-[#2E8B57]/10 text-[#2E8B57]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  
                  <Upload className="h-5 w-5 mr-3" />
                  Documents
                  {!hasAllDocs &&
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
                  }
                </button>
                <button
                  onClick={() => setActiveTab('exam')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'exam' ? 'bg-[#2E8B57]/10 text-[#2E8B57]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  
                  <FileText className="h-5 w-5 mr-3" />
                  Exam Form
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' &&
            <div className="space-y-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800">
                  Dashboard Overview
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Course Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">
                        Enrolled Course
                      </h3>
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {currentStudent.course}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Enrolled:{' '}
                      {new Date(
                      currentStudent.enrollmentDate
                    ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Fees Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">
                        Fee Status
                      </h3>
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                          Paid: KSh {currentStudent.feesPaid.toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          / KSh {currentStudent.totalFees.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                        className={`h-2 rounded-full ${isFullyPaid ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{
                          width: `${feePercentage}%`
                        }}>
                      </div>
                      </div>
                    </div>
                    {!isFullyPaid &&
                  <p className="text-sm text-orange-600 font-medium mt-2">
                        Balance: KSh {balance.toLocaleString()}
                      </p>
                  }
                  </div>

                  {/* Exam Eligibility Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">
                        Exam Status
                      </h3>
                      {currentStudent.eligibleForExams ?
                    <CheckCircle className="h-5 w-5 text-green-500" /> :

                    <XCircle className="h-5 w-5 text-red-500" />
                    }
                    </div>
                    {currentStudent.eligibleForExams ?
                  <div>
                        <p className="text-lg font-bold text-green-600">
                          Eligible
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          You meet all requirements to sit for the NTSA exam.
                        </p>
                      </div> :

                  <div>
                        <p className="text-lg font-bold text-red-600">
                          Not Eligible
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Please clear your fee balance and complete required
                          days.
                        </p>
                      </div>
                  }
                  </div>
                </div>

                {/* Alerts/Notifications */}
                {(!isFullyPaid || !hasAllDocs) &&
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <h3 className="text-orange-800 font-bold flex items-center mb-3">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Action Required
                    </h3>
                    <ul className="list-disc ml-6 space-y-2 text-orange-700 text-sm">
                      {!isFullyPaid &&
                  <li>
                          You have an outstanding fee balance of KSh{' '}
                          {balance.toLocaleString()}. Please clear it to be
                          eligible for exams.
                        </li>
                  }
                      {!hasAllDocs &&
                  <li>
                          You have pending documents to upload. Go to the
                          Documents tab to complete your profile.
                        </li>
                  }
                    </ul>
                  </div>
              }
              </div>
            }

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' &&
            <div className="space-y-6 print:hidden">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Required Documents
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Upload clear, legible copies of these documents for your
                      exam registration.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {/* Passport Photo */}
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {currentStudent.documents?.passportPhoto ?
                      <img
                        src={currentStudent.documents.passportPhoto}
                        alt="Passport"
                        className="w-16 h-16 object-cover rounded-md border border-gray-200" /> :


                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                      }
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center">
                            Passport Size Photo
                            {currentStudent.documents?.passportPhoto &&
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                          }
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Recent color photo with white background.
                          </p>
                        </div>
                      </div>
                      <div>
                        <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        className="hidden"
                        ref={passportRef}
                        onChange={(e) => handleFileChange(e, 'passportPhoto')} />
                      
                        {currentStudent.documents?.passportPhoto ?
                      <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                              Uploaded
                            </span>
                            <button
                          onClick={() => removeDocument('passportPhoto')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove">
                          
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div> :

                      <Button
                        variant="outline"
                        onClick={() => passportRef.current?.click()}
                        disabled={uploadingDoc === 'passportPhoto'}>
                        
                            {uploadingDoc === 'passportPhoto' ?
                        'Uploading...' :
                        'Upload File'}
                          </Button>
                      }
                      </div>
                    </div>

                    {/* ID Card */}
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {currentStudent.documents?.idCard ?
                      <img
                        src={currentStudent.documents.idCard}
                        alt="ID Card"
                        className="w-16 h-16 object-cover rounded-md border border-gray-200" /> :


                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                            <CreditCard className="h-6 w-6 text-gray-400" />
                          </div>
                      }
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center">
                            National ID / Alien Card
                            {currentStudent.documents?.idCard &&
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                          }
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Scanned copy of front and back.
                          </p>
                        </div>
                      </div>
                      <div>
                        <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        className="hidden"
                        ref={idCardRef}
                        onChange={(e) => handleFileChange(e, 'idCard')} />
                      
                        {currentStudent.documents?.idCard ?
                      <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                              Uploaded
                            </span>
                            <button
                          onClick={() => removeDocument('idCard')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove">
                          
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div> :

                      <Button
                        variant="outline"
                        onClick={() => idCardRef.current?.click()}
                        disabled={uploadingDoc === 'idCard'}>
                        
                            {uploadingDoc === 'idCard' ?
                        'Uploading...' :
                        'Upload File'}
                          </Button>
                      }
                      </div>
                    </div>

                    {/* PDL */}
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {currentStudent.documents?.pdl ?
                      <img
                        src={currentStudent.documents.pdl}
                        alt="PDL"
                        className="w-16 h-16 object-cover rounded-md border border-gray-200" /> :


                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                      }
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center">
                            Provisional Driving License (PDL)
                            {currentStudent.documents?.pdl &&
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                          }
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Required for driving courses only.
                          </p>
                        </div>
                      </div>
                      <div>
                        <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        className="hidden"
                        ref={pdlRef}
                        onChange={(e) => handleFileChange(e, 'pdl')} />
                      
                        {currentStudent.documents?.pdl ?
                      <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                              Uploaded
                            </span>
                            <button
                          onClick={() => removeDocument('pdl')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove">
                          
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div> :

                      <Button
                        variant="outline"
                        onClick={() => pdlRef.current?.click()}
                        disabled={uploadingDoc === 'pdl'}>
                        
                            {uploadingDoc === 'pdl' ?
                        'Uploading...' :
                        'Upload File'}
                          </Button>
                      }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            {/* EXAM FORM TAB */}
            {activeTab === 'exam' &&
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 print:hidden">
                  Examination Form
                </h2>

                {!currentStudent.eligibleForExams ?
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center print:hidden">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-800 mb-2">
                      Not Yet Eligible
                    </h3>
                    <p className="text-red-600 max-w-md mx-auto">
                      You cannot generate your exam form yet. Please ensure all
                      fees are paid and all required documents are uploaded.
                    </p>
                  </div> :
              !hasAllDocs ?
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center print:hidden">
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-orange-800 mb-2">
                      Missing Documents
                    </h3>
                    <p className="text-orange-600 max-w-md mx-auto mb-4">
                      You are financially eligible, but missing required
                      documents. Please upload them to generate your form.
                    </p>
                    <Button
                  variant="primary"
                  onClick={() => setActiveTab('documents')}>
                  
                      Go to Documents
                    </Button>
                  </div> :

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:border-none print:shadow-none print:p-0 print-exam-form">
                    {/* Official Form Border */}
                    <div className="border-2 border-gray-800 p-6">
                      {/* Header Row */}
                      <div className="flex justify-between items-start mb-3 border-b-2 border-gray-800 pb-3">
                        <img
                      src="/Lashawn_Logo-removebg-preview.png"
                      alt="Lashawn Logo"
                      className="h-10 w-auto object-contain" />
                    
                        <div className="text-center flex-1 px-4">
                          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
                            NTSA TEST BOOKING FORM
                          </h3>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            Lashawn Driving School and Computer College
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Along Eldoret Roadblock, Opposite Khetias
                            Supermarket
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1 font-mono">
                            Form No: LASH-{currentStudent.id.split('-').pop()}-
                            {new Date().getFullYear()}
                          </p>
                        </div>
                        {currentStudent.documents?.passportPhoto ?
                    <img
                      src={currentStudent.documents.passportPhoto}
                      alt="Passport"
                      className="w-28 h-32 object-cover border-2 border-gray-800" /> :


                    <div className="w-28 h-32 bg-gray-50 border-2 border-gray-800 flex items-center justify-center text-xs text-gray-400 text-center p-2">
                            PASSPORT
                            <br />
                            PHOTO
                          </div>
                    }
                      </div>

                      {/* Student Details Grid */}
                      <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm mb-5">
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Full Name
                          </p>
                          <p className="font-bold text-gray-900 border-b border-gray-400 pb-0.5">
                            {currentStudent.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Registration Number
                          </p>
                          <p className="font-bold text-gray-900 border-b border-gray-400 pb-0.5">
                            {currentStudent.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            ID Number
                          </p>
                          <p className="font-bold text-gray-900 border-b border-gray-400 pb-0.5">
                            {currentStudent.idNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Email Address
                          </p>
                          <p className="font-medium text-gray-900 border-b border-gray-400 pb-0.5">
                            {currentStudent.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Phone Number
                          </p>
                          <p className="font-medium text-gray-900 border-b border-gray-400 pb-0.5">
                            {currentStudent.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Course Category
                          </p>
                          <p className="font-bold text-gray-900 border-b border-gray-400 pb-0.5">
                            {currentStudent.course}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Enrollment Date
                          </p>
                          <p className="font-medium text-gray-900 border-b border-gray-400 pb-0.5">
                            {new Date(
                          currentStudent.enrollmentDate
                        ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Fee Status
                          </p>
                          <p className="font-medium text-gray-900 border-b border-gray-400 pb-0.5">
                            KSh {currentStudent.feesPaid.toLocaleString()} /{' '}
                            {currentStudent.totalFees.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Exam Status
                          </p>
                          <p className="font-bold text-green-700 border-b border-gray-400 pb-0.5">
                            ✓ CLEARED FOR EXAM
                          </p>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-500 mb-0.5 uppercase text-[10px] font-bold">
                            Driving School
                          </p>
                          <p className="font-bold text-gray-900 border-b border-gray-400 pb-0.5">
                            Lashawn Driving & Computer College
                          </p>
                        </div>
                      </div>

                      {/* Document Checklist & Thumbnails */}
                      <div className="mb-5 border border-gray-300 rounded p-3">
                        <h4 className="font-bold text-gray-900 uppercase text-[10px] mb-2 tracking-wider">
                          Document Checklist & Attachments
                        </h4>
                        <div className="flex justify-between items-start doc-thumbnails">
                          <div className="flex-1">
                            <p className="text-xs flex items-center mb-1">
                              <span
                            className={`w-4 inline-block font-bold ${currentStudent.documents?.passportPhoto ? 'text-green-600' : 'text-red-500'}`}>
                            
                                {currentStudent.documents?.passportPhoto ?
                            '✓' :
                            '✗'}
                              </span>
                              Passport Photo
                            </p>
                            <p className="text-xs flex items-center mb-1">
                              <span
                            className={`w-4 inline-block font-bold ${currentStudent.documents?.idCard ? 'text-green-600' : 'text-red-500'}`}>
                            
                                {currentStudent.documents?.idCard ? '✓' : '✗'}
                              </span>
                              National ID Copy
                            </p>
                            <p className="text-xs flex items-center">
                              <span
                            className={`w-4 inline-block font-bold ${currentStudent.documents?.pdl ? 'text-green-600' : 'text-red-500'}`}>
                            
                                {currentStudent.documents?.pdl ? '✓' : '✗'}
                              </span>
                              Provisional Driving License (PDL)
                            </p>
                          </div>
                          <div className="flex gap-3">
                            {currentStudent.documents?.idCard &&
                        <div className="text-center">
                                <p className="text-[9px] text-gray-500 mb-0.5 font-bold uppercase">
                                  ID Copy
                                </p>
                                <img
                            src={currentStudent.documents.idCard}
                            alt="ID Card"
                            className="w-28 h-16 object-contain border border-gray-400 p-0.5" />
                          
                              </div>
                        }
                            {currentStudent.documents?.pdl &&
                        <div className="text-center">
                                <p className="text-[9px] text-gray-500 mb-0.5 font-bold uppercase">
                                  PDL Copy
                                </p>
                                <img
                            src={currentStudent.documents.pdl}
                            alt="PDL"
                            className="w-28 h-16 object-contain border border-gray-400 p-0.5" />
                          
                              </div>
                        }
                          </div>
                        </div>
                      </div>

                      {/* Declaration */}
                      <div className="border-t border-gray-400 pt-3 mb-6">
                        <p className="text-[10px] text-gray-700 italic text-center leading-relaxed">
                          I hereby declare that all information provided above
                          is true and correct to the best of my knowledge. Any
                          false information may lead to disqualification from
                          the examination.
                        </p>
                      </div>

                      {/* Signatures */}
                      <div className="flex justify-between items-end mb-6">
                        <div className="text-center">
                          <div className="w-44 border-b-2 border-gray-800 mb-1"></div>
                          <p className="text-gray-800 text-[9px] uppercase font-bold">
                            Student Signature
                          </p>
                          <p className="text-gray-400 text-[9px] mt-0.5">
                            Date: _______________
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-44 border-b-2 border-gray-800 mb-1"></div>
                          <p className="text-gray-800 text-[9px] uppercase font-bold">
                            School Stamp & Manager
                          </p>
                          <p className="text-gray-400 text-[9px] mt-0.5">
                            Date: _______________
                          </p>
                        </div>
                      </div>

                      {/* QR Code & Footer */}
                      <div className="flex justify-between items-end border-t border-gray-300 pt-3">
                        <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`LASHAWN|${currentStudent.id}|${currentStudent.name}|${currentStudent.course}|CLEARED`)}`}
                      alt="Verification QR Code"
                      className="w-16 h-16" />
                    
                        <div className="text-right">
                          <p className="text-[9px] text-gray-500">
                            Generated: {new Date().toLocaleDateString()} at{' '}
                            {new Date().toLocaleTimeString()}
                          </p>
                          <p className="text-[9px] text-gray-400">
                            Scan QR code to verify this document
                          </p>
                          <p className="text-[9px] text-gray-400 font-mono">
                            Ref: LASH-{currentStudent.id.split('-').pop()}-
                            {Date.now().toString(36).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
              }

                {/* Print Button (Outside the printable area) */}
                {currentStudent.eligibleForExams && hasAllDocs &&
              <div className="mt-6 flex justify-end print:hidden no-print">
                    <Button variant="primary" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Exam Form
                    </Button>
                  </div>
              }
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}