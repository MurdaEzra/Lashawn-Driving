import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  GraduationCap,
  CreditCard,
  ShieldAlert,
  Edit3,
  Save,
  X,
  DollarSign,
  Trash2,
  Check,
  Award,
  AlertTriangle,
  Plus } from
'lucide-react';
import { useStudentContext } from '../contexts/StudentContext';
// Fee Structure State
const DEFAULT_FEES = {
  'Category A (Motorcycles)': {
    theoryOnly: 5000,
    practical: 8000,
    both: 12000
  },
  'Category B (Cars)': {
    theoryOnly: 6000,
    practical: 12000,
    both: 16000
  },
  'Category C (Light Commercial)': {
    theoryOnly: 7000,
    practical: 14000,
    both: 19000
  },
  'Category D (Heavy Vehicles)': {
    theoryOnly: 8000,
    practical: 18000,
    both: 24000
  },
  'Tuktuk (Three-wheelers)': {
    theoryOnly: 4000,
    practical: 7000,
    both: 10000
  },
  'Microsoft Office Suite': {
    theoryOnly: 0,
    practical: 0,
    both: 8000
  },
  'Basic IT & Networking': {
    theoryOnly: 0,
    practical: 0,
    both: 10000
  },
  'First Aid Training': {
    theoryOnly: 0,
    practical: 0,
    both: 5000
  },
  'Basic Mechanics': {
    theoryOnly: 0,
    practical: 0,
    both: 7000
  },
  'KRA PIN Registration': {
    theoryOnly: 0,
    practical: 0,
    both: 500
  },
  'HELB Application Assistance': {
    theoryOnly: 0,
    practical: 0,
    both: 800
  },
  'eCitizen Service Support': {
    theoryOnly: 0,
    practical: 0,
    both: 500
  },
  'Driving License Renewal': {
    theoryOnly: 0,
    practical: 0,
    both: 1000
  }
};
// Road Signs State
const DEFAULT_ROAD_SIGNS = [
{
  id: '1',
  name: 'Stop',
  description: 'Come to a complete stop',
  color: '#D7263D'
},
{
  id: '2',
  name: 'Yield',
  description: 'Give way to oncoming traffic',
  color: '#F59E0B'
},
{
  id: '3',
  name: 'No Entry',
  description: 'Entry prohibited for all vehicles',
  color: '#D7263D'
},
{
  id: '4',
  name: 'Speed Limit',
  description: 'Maximum speed allowed',
  color: '#D7263D'
},
{
  id: '5',
  name: 'One Way',
  description: 'Traffic flows in one direction only',
  color: '#1E90FF'
},
{
  id: '6',
  name: 'No Parking',
  description: 'Parking not allowed',
  color: '#D7263D'
},
{
  id: '7',
  name: 'Roundabout',
  description: 'Circular intersection ahead',
  color: '#1E90FF'
},
{
  id: '8',
  name: 'Pedestrian Crossing',
  description: 'Watch for pedestrians',
  color: '#F59E0B'
}];

export function AdminDashboard() {
  const navigate = useNavigate();
  const {
    students: contextStudents,
    updateStudent,
    deleteStudent
  } = useStudentContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [students, setStudents] = useState(contextStudents);
  const [activeTab, setActiveTab] = useState<'students' | 'fees' | 'signs'>(
    'students'
  );
  const [fees, setFees] = useState(DEFAULT_FEES);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    theoryOnly: 0,
    practical: 0,
    both: 0
  });
  const [feeSaved, setFeeSaved] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Road Signs State
  const [roadSigns, setRoadSigns] = useState(() => {
    const saved = localStorage.getItem('lashawn_road_signs');
    return saved ? JSON.parse(saved) : DEFAULT_ROAD_SIGNS;
  });
  const [editingSign, setEditingSign] = useState<string | null>(null);
  const [editSignValues, setEditSignValues] = useState({
    name: '',
    description: '',
    color: ''
  });
  useEffect(() => {
    localStorage.setItem('lashawn_road_signs', JSON.stringify(roadSigns));
  }, [roadSigns]);
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuth');
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [navigate]);
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };
  useEffect(() => {
    let filtered = contextStudents;
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCourse !== 'All') {
      filtered = filtered.filter((s) => s.course.includes(filterCourse));
    }
    setStudents(filtered);
  }, [searchTerm, filterCourse, contextStudents]);
  // Close action menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const totalStudents = contextStudents.length;
  const eligibleStudents = contextStudents.filter(
    (s) => s.eligibleForExams
  ).length;
  const totalRevenue = contextStudents.reduce((sum, s) => sum + s.feesPaid, 0);
  const pendingFees = contextStudents.reduce(
    (sum, s) => sum + (s.totalFees - s.feesPaid),
    0
  );
  const startEditingFee = (category: string) => {
    setEditingFee(category);
    setEditValues(fees[category as keyof typeof fees]);
    setFeeSaved(false);
  };
  const saveFee = () => {
    if (editingFee) {
      setFees((prev) => ({
        ...prev,
        [editingFee]: editValues
      }));
      setEditingFee(null);
      setFeeSaved(true);
      setTimeout(() => setFeeSaved(false), 3000);
    }
  };
  const cancelEditFee = () => {
    setEditingFee(null);
  };
  const handleMarkPaid = (studentId: string, totalFees: number) => {
    updateStudent(studentId, {
      feesPaid: totalFees
    });
    setOpenActionMenu(null);
  };
  const handleToggleEligibility = (
  studentId: string,
  currentStatus: boolean) =>
  {
    updateStudent(studentId, {
      eligibleForExams: !currentStatus
    });
    setOpenActionMenu(null);
  };
  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteStudent(studentId);
    }
    setOpenActionMenu(null);
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-[#2E8B57] p-2 rounded-lg mr-3">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lashawn Admin Portal</h1>
              <p className="text-xs text-gray-400">Student Management System</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-300 hover:text-white transition-colors text-sm font-medium bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700">
            
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="bg-blue-100 p-4 rounded-full mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="bg-green-100 p-4 rounded-full mr-4">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Exam Eligible</p>
              <p className="text-2xl font-bold text-gray-900">
                {eligibleStudents}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="bg-emerald-100 p-4 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                KSh {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="bg-orange-100 p-4 rounded-full mr-4">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                KSh {pendingFees.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'students' ? 'border-[#2E8B57] text-[#2E8B57]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            
            <Users className="h-4 w-4 inline mr-2" />
            Student Directory
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'fees' ? 'border-[#2E8B57] text-[#2E8B57]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            
            <DollarSign className="h-4 w-4 inline mr-2" />
            Fee Structure
          </button>
          <button
            onClick={() => setActiveTab('signs')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'signs' ? 'border-[#2E8B57] text-[#2E8B57]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Road Signs
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' &&
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-800">
                All Admitted Students
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none w-full sm:w-64" />
                
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#2E8B57] focus:border-[#2E8B57] outline-none appearance-none bg-white w-full sm:w-auto">
                  
                    <option value="All">All Courses</option>
                    <option value="Category">Driving Courses</option>
                    <option value="Microsoft">Computer Courses</option>
                    <option value="Basic IT">IT Courses</option>
                  </select>
                </div>
                <button className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold">Reg No. & Name</th>
                    <th className="px-6 py-4 font-semibold">Course Enrolled</th>
                    <th className="px-6 py-4 font-semibold">Fees Status</th>
                    <th className="px-6 py-4 font-semibold">Pending Days</th>
                    <th className="px-6 py-4 font-semibold">
                      Exam Eligibility
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.length > 0 ?
                students.map((student) => {
                  const feePercentage =
                  student.feesPaid / student.totalFees * 100;
                  const isFullyPaid = feePercentage === 100;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors">
                      
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] flex items-center justify-center font-bold text-sm mr-3">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.name}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {student.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">
                              {student.course}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  KSh {student.feesPaid.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  / {student.totalFees.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                              className={`h-1.5 rounded-full ${isFullyPaid ? 'bg-green-500' : 'bg-orange-500'}`}
                              style={{
                                width: `${feePercentage}%`
                              }}>
                            </div>
                              </div>
                              {!isFullyPaid &&
                          <span className="text-xs text-orange-600 mt-1 font-medium">
                                  Balance: KSh{' '}
                                  {(
                            student.totalFees - student.feesPaid).
                            toLocaleString()}
                                </span>
                          }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {student.pendingDays > 0 ?
                        <div className="flex items-center text-sm text-gray-700">
                                <Clock className="h-4 w-4 text-blue-500 mr-1.5" />
                                {student.pendingDays} days left
                              </div> :

                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                        }
                          </td>
                          <td className="px-6 py-4">
                            {student.eligibleForExams ?
                        <div className="flex items-center text-sm text-green-600 font-medium">
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Eligible
                              </div> :

                        <div className="flex items-center text-sm text-red-600 font-medium">
                                <XCircle className="h-4 w-4 mr-1.5" />
                                Not Eligible
                              </div>
                        }
                          </td>
                          <td className="px-6 py-4 text-right relative">
                            <button
                          onClick={() =>
                          setOpenActionMenu(
                            openActionMenu === student.id ?
                            null :
                            student.id
                          )
                          }
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                          
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {openActionMenu === student.id &&
                        <div
                          ref={menuRef}
                          className="absolute right-8 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1 text-left">
                          
                                {!isFullyPaid &&
                          <button
                            onClick={() =>
                            handleMarkPaid(
                              student.id,
                              student.totalFees
                            )
                            }
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                            
                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                    Mark as Fully Paid
                                  </button>
                          }
                                <button
                            onClick={() =>
                            handleToggleEligibility(
                              student.id,
                              student.eligibleForExams
                            )
                            }
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                            
                                  <Award className="h-4 w-4 mr-2 text-blue-500" />
                                  Toggle Eligibility
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                            onClick={() =>
                            handleDeleteStudent(student.id)
                            }
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                            
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Student
                                </button>
                              </div>
                        }
                          </td>
                        </tr>);

                }) :

                <tr>
                      <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500">
                    
                        <div className="flex flex-col items-center justify-center">
                          <Search className="h-8 w-8 text-gray-300 mb-2" />
                          <p>No students found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                }
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-600">
                Showing <span className="font-medium">{students.length}</span>{' '}
                of <span className="font-medium">{contextStudents.length}</span>{' '}
                students
              </span>
              <div className="flex space-x-2">
                <button
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled>
                
                  Previous
                </button>
                <button
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled>
                
                  Next
                </button>
              </div>
            </div>
          </div>
        }

        {/* Fee Structure Tab */}
        {activeTab === 'fees' &&
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Fee Structure Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Click the edit icon on any course to update its fees.
                </p>
              </div>
              {feeSaved &&
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-4 py-2 rounded-md">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Fees updated successfully
                </div>
            }
            </div>

            {/* Driving Courses Fees */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Driving Courses
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2E8B57] text-white text-sm">
                      <th className="px-4 py-3 rounded-tl-lg">Category</th>
                      <th className="px-4 py-3">Theory Only (KSh)</th>
                      <th className="px-4 py-3">Practical Only (KSh)</th>
                      <th className="px-4 py-3">Theory & Practical (KSh)</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(fees).
                  filter(
                    ([key]) =>
                    key.startsWith('Category') ||
                    key.startsWith('Tuktuk')
                  ).
                  map(([category, values], index) =>
                  <tr
                    key={category}
                    className={
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }>
                    
                          <td className="px-4 py-3 font-medium text-gray-800 text-sm">
                            {category}
                          </td>
                          {editingFee === category ?
                    <>
                              <td className="px-4 py-3">
                                <input
                          type="number"
                          value={editValues.theoryOnly}
                          onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            theoryOnly: Number(e.target.value)
                          }))
                          }
                          className="w-24 border border-[#2E8B57] rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                        
                              </td>
                              <td className="px-4 py-3">
                                <input
                          type="number"
                          value={editValues.practical}
                          onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            practical: Number(e.target.value)
                          }))
                          }
                          className="w-24 border border-[#2E8B57] rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                        
                              </td>
                              <td className="px-4 py-3">
                                <input
                          type="number"
                          value={editValues.both}
                          onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            both: Number(e.target.value)
                          }))
                          }
                          className="w-24 border border-[#2E8B57] rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                        
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                            onClick={saveFee}
                            className="p-1.5 bg-[#2E8B57] text-white rounded-md hover:bg-[#267349] transition-colors"
                            title="Save">
                            
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                            onClick={cancelEditFee}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                            title="Cancel">
                            
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </> :

                    <>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {values.theoryOnly.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {values.practical.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-[#2E8B57]">
                                {values.both.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                          onClick={() => startEditingFee(category)}
                          className="p-1.5 text-gray-400 hover:text-[#2E8B57] hover:bg-[#2E8B57]/10 rounded-md transition-colors"
                          title="Edit fees">
                          
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                    }
                        </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Computer Courses Fees */}
            <div className="p-6 pt-0">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Computer Courses
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1E90FF] text-white text-sm">
                      <th className="px-4 py-3 rounded-tl-lg">Course</th>
                      <th className="px-4 py-3">Course Fee (KSh)</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(fees).
                  filter(
                    ([key]) =>
                    key.startsWith('Microsoft') ||
                    key.startsWith('Basic IT')
                  ).
                  map(([category, values], index) =>
                  <tr
                    key={category}
                    className={
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }>
                    
                          <td className="px-4 py-3 font-medium text-gray-800 text-sm">
                            {category}
                          </td>
                          {editingFee === category ?
                    <>
                              <td className="px-4 py-3">
                                <input
                          type="number"
                          value={editValues.both}
                          onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            both: Number(e.target.value)
                          }))
                          }
                          className="w-28 border border-[#1E90FF] rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#1E90FF] outline-none" />
                        
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                            onClick={saveFee}
                            className="p-1.5 bg-[#1E90FF] text-white rounded-md hover:bg-blue-600 transition-colors"
                            title="Save">
                            
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                            onClick={cancelEditFee}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                            title="Cancel">
                            
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </> :

                    <>
                              <td className="px-4 py-3 text-sm font-medium text-[#1E90FF]">
                                {values.both.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                          onClick={() => startEditingFee(category)}
                          className="p-1.5 text-gray-400 hover:text-[#1E90FF] hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit fees">
                          
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                    }
                        </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Special Courses Fees */}
            <div className="p-6 pt-0">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Special Courses
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#D7263D] text-white text-sm">
                      <th className="px-4 py-3 rounded-tl-lg">Course</th>
                      <th className="px-4 py-3">Course Fee (KSh)</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(fees).
                  filter(
                    ([key]) =>
                    key === 'First Aid Training' ||
                    key === 'Basic Mechanics'
                  ).
                  map(([category, values], index) =>
                  <tr
                    key={category}
                    className={
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }>
                    
                          <td className="px-4 py-3 font-medium text-gray-800 text-sm">
                            {category}
                          </td>
                          {editingFee === category ?
                    <>
                              <td className="px-4 py-3">
                                <input
                          type="number"
                          value={editValues.both}
                          onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            both: Number(e.target.value)
                          }))
                          }
                          className="w-28 border border-[#D7263D] rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#D7263D] outline-none" />
                        
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                            onClick={saveFee}
                            className="p-1.5 bg-[#D7263D] text-white rounded-md hover:bg-red-600 transition-colors"
                            title="Save">
                            
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                            onClick={cancelEditFee}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                            title="Cancel">
                            
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </> :

                    <>
                              <td className="px-4 py-3 text-sm font-medium text-[#D7263D]">
                                {values.both.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                          onClick={() => startEditingFee(category)}
                          className="p-1.5 text-gray-400 hover:text-[#D7263D] hover:bg-red-50 rounded-md transition-colors"
                          title="Edit fees">
                          
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                    }
                        </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Services Fees */}
            <div className="p-6 pt-0">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Additional Services
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white text-sm">
                      <th className="px-4 py-3 rounded-tl-lg">Service</th>
                      <th className="px-4 py-3">Fee (KSh)</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(fees).
                  filter(
                    ([key]) =>
                    key === 'KRA PIN Registration' ||
                    key === 'HELB Application Assistance' ||
                    key === 'eCitizen Service Support' ||
                    key === 'Driving License Renewal'
                  ).
                  map(([category, values], index) =>
                  <tr
                    key={category}
                    className={
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }>
                    
                          <td className="px-4 py-3 font-medium text-gray-800 text-sm">
                            {category}
                          </td>
                          {editingFee === category ?
                    <>
                              <td className="px-4 py-3">
                                <input
                          type="number"
                          value={editValues.both}
                          onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            both: Number(e.target.value)
                          }))
                          }
                          className="w-28 border border-gray-800 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-gray-800 outline-none" />
                        
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                            onClick={saveFee}
                            className="p-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                            title="Save">
                            
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                            onClick={cancelEditFee}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                            title="Cancel">
                            
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </> :

                    <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                {values.both.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                          onClick={() => startEditingFee(category)}
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit fees">
                          
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                    }
                        </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              <p>
                Note: Fee changes will apply to new registrations only. Existing
                student fees remain unchanged.
              </p>
            </div>
          </div>
        }

        {/* Road Signs Tab */}
        {activeTab === 'signs' &&
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0 overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Manage Road Signs
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  These signs will be displayed on the FAQ page.
                </p>
              </div>
              <button
              onClick={() => {
                const newId = Date.now().toString();
                setRoadSigns([
                ...roadSigns,
                {
                  id: newId,
                  name: 'New Sign',
                  description: 'Description',
                  color: '#2E8B57'
                }]
                );
                setEditingSign(newId);
                setEditSignValues({
                  name: 'New Sign',
                  description: 'Description',
                  color: '#2E8B57'
                });
              }}
              className="flex items-center bg-[#2E8B57] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#267349] transition-colors">
              
                <Plus className="h-4 w-4 mr-2" />
                Add Sign
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {roadSigns.map((sign: any) =>
            <div
              key={sign.id}
              className="border border-gray-200 rounded-lg p-4 relative group hover:border-[#2E8B57] transition-colors">
              
                  {editingSign === sign.id ?
              <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Name
                        </label>
                        <input
                    type="text"
                    value={editSignValues.name}
                    onChange={(e) =>
                    setEditSignValues({
                      ...editSignValues,
                      name: e.target.value
                    })
                    }
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-[#2E8B57] outline-none" />
                  
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Description
                        </label>
                        <textarea
                    value={editSignValues.description}
                    onChange={(e) =>
                    setEditSignValues({
                      ...editSignValues,
                      description: e.target.value
                    })
                    }
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-[#2E8B57] outline-none"
                    rows={2} />
                  
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Color
                        </label>
                        <div className="flex gap-2">
                          <input
                      type="color"
                      value={editSignValues.color}
                      onChange={(e) =>
                      setEditSignValues({
                        ...editSignValues,
                        color: e.target.value
                      })
                      }
                      className="h-8 w-8 rounded cursor-pointer" />
                    
                          <input
                      type="text"
                      value={editSignValues.color}
                      onChange={(e) =>
                      setEditSignValues({
                        ...editSignValues,
                        color: e.target.value
                      })
                      }
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:border-[#2E8B57] outline-none uppercase" />
                    
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                    onClick={() => setEditingSign(null)}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    
                          Cancel
                        </button>
                        <button
                    onClick={() => {
                      setRoadSigns(
                        roadSigns.map((s: any) =>
                        s.id === sign.id ?
                        {
                          ...s,
                          ...editSignValues
                        } :
                        s
                        )
                      );
                      setEditingSign(null);
                    }}
                    className="px-3 py-1 text-xs bg-[#2E8B57] text-white rounded hover:bg-[#267349]">
                    
                          Save
                        </button>
                      </div>
                    </div> :

              <>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                    onClick={() => {
                      setEditingSign(sign.id);
                      setEditSignValues({
                        name: sign.name,
                        description: sign.description,
                        color: sign.color
                      });
                    }}
                    className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-600">
                    
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                    onClick={() => {
                      if (window.confirm('Delete this sign?')) {
                        setRoadSigns(
                          roadSigns.filter((s: any) => s.id !== sign.id)
                        );
                      }
                    }}
                    className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-600">
                    
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-col items-center text-center mt-2">
                        <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-sm"
                    style={{
                      backgroundColor: sign.color
                    }}>
                    
                          {sign.name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">
                          {sign.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {sign.description}
                        </p>
                      </div>
                    </>
              }
                </div>
            )}
            </div>
          </div>
        }
      </div>
    </div>);

}