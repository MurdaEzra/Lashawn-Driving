import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import {
  CheckCircle,
  Printer,
  CreditCard,
  Smartphone,
  Shield,
  AlertCircle,
  Copy } from
'lucide-react';
import { useStudentContext } from '../contexts/StudentContext';
import { supabase } from '../contexts/supabaseClient';
import StripeCardForm from '../components/ui/StripeCardForm';
export function Registration() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [tempPassword, setTempPassword] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const { addStudent } = useStudentContext();
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    applicationType: '',
    branch: '',
    drivingCategory: '',
    drivingClass: '',
    studentName: '',
    idNumber: '',
    gender: '',
    dob: '',
    nationality: '',
    county: '',
    email: '',
    phone: '',
    previousExperience: '',
    healthCondition: '',
    // Step 2: Contacts & Schedule
    kinName: '',
    kinRelationship: '',
    kinPhone: '',
    kinEmail: '',
    kinCity: '',
    isSelfSponsored: 'yes',
    sponsorName: '',
    sponsorRelationship: '',
    sponsorPhone: '',
    sponsorEmail: '',
    sponsorCity: '',
    schedule: '',
    source: '',
    salesPerson: '',
    termsAccepted: false,
    privacyAccepted: false
  });
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'KE'
    }
  });

  // Update billing name when student name changes
  useEffect(() => {
    if (formData.studentName) {
      setBillingDetails(prev => ({ ...prev, name: formData.studentName }));
    }
  }, [formData.studentName]);
  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const nextStep = () => {
    setStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };
  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };
  const generateRegistrationNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('registration_number')
        .limit(10000);

      if (error) {
        console.error('Error fetching registration numbers:', error);
      }

      let max = 0;
      (data || []).forEach((row: any) => {
        const rn = String(row.registration_number || '').trim();
        if (/^\d+$/.test(rn)) {
          const n = parseInt(rn, 10);
          if (n > max) max = n;
        } else {
          // Try to extract trailing numeric part from legacy formats
          const m = rn.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > max) max = n;
          }
        }
      });

      const next = max + 1;
      return `LASH-2026-${String(next).padStart(4, '0')}`;
    } catch (e) {
      console.error('generateRegistrationNumber error', e);
      const fallback = Math.floor(1 + Math.random() * 9999);
      return `LASH-2026-${String(fallback).padStart(4, '0')}`;
    }
  };
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newRegNum = await generateRegistrationNumber();
      setRegistrationNumber(newRegNum);

      // Calculate fees
      const totalFee = getInvoiceTotal();
      const minAmount = Math.ceil(totalFee * 0.3);
      const chosenAmount = paymentAmount === '' ? totalFee : Number(paymentAmount);

      if (chosenAmount < minAmount) {
        alert(`Amount must be at least KSh ${minAmount.toLocaleString()}`);
        setIsSubmitting(false);
        return;
      }

      if (paymentMethod === 'mpesa') {
        // Insert student
        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert({
            registration_number: newRegNum,
            name: formData.studentName,
            id_number: formData.idNumber,
            gender: formData.gender,
            dob: formData.dob,
            nationality: formData.nationality,
            county: formData.county,
            email: formData.email,
            phone: formData.phone,
            previous_experience: formData.previousExperience,
            health_condition: formData.healthCondition,
            status: false,
            fees_paid: chosenAmount,
            total_fees: totalFee,
            eligible_for_exams: false
          })
          .select()
          .single();

        if (studentError) {
          console.error('Student insert error:', studentError);
          alert('Failed to save student data. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Insert application
        const { error: appError } = await supabase
          .from('applications')
          .insert({
            student_id: student.id,
            application_type: formData.applicationType,
            branch: formData.branch,
            driving_category: formData.drivingCategory,
            driving_class: formData.drivingClass,
            schedule: formData.schedule,
            source: formData.source,
            sales_person: formData.salesPerson,
            terms_accepted: formData.termsAccepted,
            privacy_accepted: formData.privacyAccepted
          });

        if (appError) {
          console.error('Application insert error:', appError);
          // Continue, as student is inserted
        }

        // Insert next of kin
        const { error: kinError } = await supabase
          .from('next_of_kin')
          .insert({
            student_id: student.id,
            name: formData.kinName,
            relationship: formData.kinRelationship,
            phone: formData.kinPhone,
            email: formData.kinEmail,
            city: formData.kinCity
          });

        if (kinError) {
          console.error('Next of kin insert error:', kinError);
        }

        // Insert sponsor
        const sponsorData = formData.isSelfSponsored === 'no' ? {
          student_id: student.id,
          name: formData.sponsorName,
          relationship: formData.sponsorRelationship,
          phone: formData.sponsorPhone,
          email: formData.sponsorEmail,
          city: formData.sponsorCity,
          is_self_sponsored: false
        } : {
          student_id: student.id,
          name: formData.studentName,
          relationship: 'Self',
          phone: formData.phone,
          email: formData.email,
          city: formData.county,
          is_self_sponsored: true
        };

        const { error: sponsorError } = await supabase
          .from('sponsors')
          .insert(sponsorData);

        if (sponsorError) {
          console.error('Sponsor insert error:', sponsorError);
        }

        // Insert payment
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            student_id: student.id,
            amount: chosenAmount,
            method: 'mpesa',
            status: 'pending'
          });

        if (paymentError) {
          console.error('Payment insert error:', paymentError);
        }

        // Normalize phone to international MSISDN (Kenya: 254...) and call server
        let phone = (formData.phone || '').toString().trim();
        // remove leading + and convert leading 0 to country code 254
        phone = phone.replace(/^\+/, '').replace(/^0/, '254');

        // Determine API base:
        // - If Vite env `VITE_API_BASE` is provided at build time, use that (recommended for Render).
        // - Otherwise, use localhost backend during dev or current origin in production.
        const apiBase = 'https://lashawn-backend.onrender.com';

        const resp = await fetch(`${apiBase}/api/stkpush`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, amount: chosenAmount, registration_number: newRegNum })
        });

        const data = await resp.json();

        if (!resp.ok) {
          console.error('STK init error:', data);
          alert('Failed to initiate MPESA payment. Please try again.');
          setIsSubmitting(false);
          return;
        }

        alert('STK Push initiated. Check your phone to complete payment.');
        // Add pending student to local context for immediate UI
        addStudent({
          id: newRegNum,
          name: formData.studentName,
          idNumber: formData.idNumber,
          email: formData.email,
          phone: formData.phone,
          course: formData.drivingCategory || 'General Course',
          feesPaid: chosenAmount,
          totalFees: totalFee,
          pendingDays: 30,
          eligibleForExams: false,
          status: 'Pending Payment',
          enrollmentDate: new Date().toISOString().split('T')[0],
          documents: {}
        });

        // Move to confirmation/awaiting payment step
        setStep(4);
        window.scrollTo(0, 0);
      } else {
        // Card flow: create records and show card form
        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert({
            registration_number: newRegNum,
            name: formData.studentName,
            id_number: formData.idNumber,
            gender: formData.gender,
            dob: formData.dob,
            nationality: formData.nationality,
            county: formData.county,
            email: formData.email,
            phone: formData.phone,
            previous_experience: formData.previousExperience,
            health_condition: formData.healthCondition,
            status: false,
            fees_paid: chosenAmount,
            total_fees: totalFee,
            eligible_for_exams: false
          })
          .select()
          .single();

        if (studentError) {
          console.error('Student insert error:', studentError);
          alert('Failed to save student data. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Insert application
        const { error: appError } = await supabase
          .from('applications')
          .insert({
            student_id: student.id,
            application_type: formData.applicationType,
            branch: formData.branch,
            driving_category: formData.drivingCategory,
            driving_class: formData.drivingClass,
            schedule: formData.schedule,
            source: formData.source,
            sales_person: formData.salesPerson,
            terms_accepted: formData.termsAccepted,
            privacy_accepted: formData.privacyAccepted
          });

        if (appError) {
          console.error('Application insert error:', appError);
        }

        // Insert next of kin
        const { error: kinError } = await supabase
          .from('next_of_kin')
          .insert({
            student_id: student.id,
            name: formData.kinName,
            relationship: formData.kinRelationship,
            phone: formData.kinPhone,
            email: formData.kinEmail,
            city: formData.kinCity
          });

        if (kinError) {
          console.error('Next of kin insert error:', kinError);
        }

        // Insert sponsor
        const sponsorData = formData.isSelfSponsored === 'no' ? {
          student_id: student.id,
          name: formData.sponsorName,
          relationship: formData.sponsorRelationship,
          phone: formData.sponsorPhone,
          email: formData.sponsorEmail,
          city: formData.sponsorCity,
          is_self_sponsored: false
        } : {
          student_id: student.id,
          name: formData.studentName,
          relationship: 'Self',
          phone: formData.phone,
          email: formData.email,
          city: formData.county,
          is_self_sponsored: true
        };

        const { error: sponsorError } = await supabase
          .from('sponsors')
          .insert(sponsorData);

        if (sponsorError) {
          console.error('Sponsor insert error:', sponsorError);
        }

        // Insert payment
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            student_id: student.id,
            amount: chosenAmount,
            method: 'card',
            status: 'pending'
          });

        if (paymentError) {
          console.error('Payment insert error:', paymentError);
        }

        // Show the Stripe card form to collect card details and confirm payment
        setShowCardForm(true);
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePrint = () => {
    window.print();
  };
  // Calculate mock invoice total based on category
  const getInvoiceTotal = () => {
    let total = 0;
    if (formData.drivingCategory === 'Category A (Motorcycles)') total = 12000;else
    if (formData.drivingCategory === 'Category B (Cars)') total = 16000;else
    if (formData.drivingCategory === 'Category C (Light Commercial)')
    total = 19000;else
    if (formData.drivingCategory === 'Category D (Heavy Vehicles)')
    total = 24000;else
    if (formData.drivingCategory === 'Tuktuk (Three-wheelers)')
    total = 10000;else
    total = 15000; // Default fallback
    // Add registration fee
    return total + 1500;
  };
  const transactionId = Math.random().
  toString(36).
  substring(2, 10).
  toUpperCase();
  const currentDate = new Date().toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const copyRegNumber = () => {
    navigator.clipboard.writeText(registrationNumber);
  };

  const handleCardSuccess = async () => {
    try {
      // Fetch updated student record to get temp password (if stored)
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('registration_number', registrationNumber)
        .single();

      if (error) {
        console.error('Error fetching student after card payment', error);
      }

      const paid = paymentAmount === '' ? getInvoiceTotal() : paymentAmount;

      addStudent({
        id: registrationNumber,
        name: formData.studentName,
        idNumber: formData.idNumber,
        email: formData.email,
        phone: formData.phone,
        course: formData.drivingCategory || 'General Course',
        feesPaid: paid,
        totalFees: getInvoiceTotal(),
        pendingDays: 30,
        eligibleForExams: false,
        status: 'Active',
        enrollmentDate: new Date().toISOString().split('T')[0],
        documents: {},
        tempPassword: student?.temp_password || ''
      });

      setTempPassword(student?.temp_password || '');
      setShowCardForm(false);
      setStep(4);
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('handleCardSuccess error', e);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-12 print:bg-white print:py-0">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-none print:px-0">
        {/* Header - Hidden on Print */}
        <div className="mb-8 text-center print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Registration
          </h1>
          <p className="text-gray-600">
            Application for Driving/Riding Instruction
          </p>
        </div>

        {/* Progress Bar - Hidden on Print */}
        {step < 4 &&
        <div className="mb-8 print:hidden">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
              <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-[#2E8B57] transition-all duration-300 -z-10"
              style={{
                width: `${(step - 1) / 2 * 100}%`
              }}>
            </div>

              {[1, 2, 3].map((num) =>
            <div
              key={num}
              className={`flex flex-col items-center ${step >= num ? 'text-[#2E8B57]' : 'text-gray-400'}`}>
              
                  <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-colors duration-300 ${step >= num ? 'bg-[#2E8B57]' : 'bg-gray-300'}`}>
                
                    {step > num ? <CheckCircle size={20} /> : num}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">
                    {num === 1 ?
                'Personal Details' :
                num === 2 ?
                'Contacts & Schedule' :
                'Payment'}
                  </span>
                </div>
            )}
            </div>
          </div>
        }

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
          {/* STEP 1: Personal Details */}
          {step === 1 &&
          <div className="p-6 sm:p-10">
              <div className="mb-8 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Step 1/3 - Applicant's Personal Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Please enter your details exactly as they appear on your ID
                  card.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Type *
                  </label>
                  <select
                  name="applicationType"
                  value={formData.applicationType}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="New">New Application</option>
                    <option value="Renewal">Renewal</option>
                    <option value="Endorsement">Endorsement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Nairobi Main">Eldoret Road Branch</option>
                    <option value="Eldoret">Eldoret Town Branch</option>
                    <option value="Mombasa">Nyahururu Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driving Category *
                  </label>
                  <select
                  name="drivingCategory"
                  value={formData.drivingCategory}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Category A (Motorcycles)">
                      Category A (Motorcycles)
                    </option>
                    <option value="Category B (Cars)">Category B (Cars)</option>
                    <option value="Category C (Light Commercial)">
                      Category C (Light Commercial)
                    </option>
                    <option value="Category D (Heavy Vehicles)">
                      Category D (Heavy Vehicles)
                    </option>
                    <option value="Tuktuk (Three-wheelers)">
                      Tuktuk (Three-wheelers)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driving Class *
                  </label>
                  <select
                  name="drivingClass"
                  value={formData.drivingClass}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Theory & Practical">
                      Theory & Practical (Full Course)
                    </option>
                    <option value="Practical Only">Practical Only</option>
                    <option value="Theory Only">Theory Only</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name *
                  </label>
                  <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="e.g Wekesa Simiyu"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID / Alien ID Number *
                  </label>
                  <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="e.g 87654321"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality *
                  </label>
                  <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Kenyan">Kenyan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County *
                  </label>
                  <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  placeholder="e.g Nairobi"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g lash@gmail.com"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g +254712345678"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous driving experience? *
                  </label>
                  <select
                  name="previousExperience"
                  value={formData.previousExperience}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Do you have any health condition that can sometimes affect
                    your driving? *
                  </label>
                  <select
                  name="healthCondition"
                  value={formData.healthCondition}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                variant="primary"
                onClick={nextStep}
                disabled={
                !formData.applicationType ||
                !formData.branch ||
                !formData.drivingCategory ||
                !formData.drivingClass ||
                !formData.studentName ||
                !formData.idNumber ||
                !formData.gender ||
                !formData.dob ||
                !formData.nationality ||
                !formData.county ||
                !formData.email ||
                !formData.phone ||
                !formData.previousExperience ||
                !formData.healthCondition
                }>
                
                  Next Step
                </Button>
              </div>
            </div>
          }

          {/* STEP 2: Contacts & Schedule */}
          {step === 2 &&
          <div className="p-6 sm:p-10">
              <div className="mb-8 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Step 2/3 - Contacts & Schedule
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Emergency contacts, sponsorship details, and class scheduling.
                </p>
              </div>

              {/* Next of Kin */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield size={18} className="mr-2 text-[#2E8B57]" />
                  a) Contact in Case of Emergency (Next of Kin)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                    type="text"
                    name="kinName"
                    value={formData.kinName}
                    onChange={handleChange}
                    placeholder="e.g Mary Wema"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <input
                    type="text"
                    name="kinRelationship"
                    value={formData.kinRelationship}
                    onChange={handleChange}
                    placeholder="e.g Mother"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                    type="tel"
                    name="kinPhone"
                    value={formData.kinPhone}
                    onChange={handleChange}
                    placeholder="e.g +254712345678"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                    type="email"
                    name="kinEmail"
                    value={formData.kinEmail}
                    onChange={handleChange}
                    placeholder="e.g someone@gmail.com"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City/Town *
                    </label>
                    <input
                    type="text"
                    name="kinCity"
                    value={formData.kinCity}
                    onChange={handleChange}
                    placeholder="e.g Nairobi"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                  </div>
                </div>
              </div>

              {/* Sponsor Details */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    b) Sponsor's Details
                  </h3>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input
                      type="radio"
                      name="isSelfSponsored"
                      value="yes"
                      checked={formData.isSelfSponsored === 'yes'}
                      onChange={handleChange}
                      className="mr-2 text-[#2E8B57] focus:ring-[#2E8B57]" />
                    
                      Self-Sponsored
                    </label>
                    <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input
                      type="radio"
                      name="isSelfSponsored"
                      value="no"
                      checked={formData.isSelfSponsored === 'no'}
                      onChange={handleChange}
                      className="mr-2 text-[#2E8B57] focus:ring-[#2E8B57]" />
                    
                      Other Sponsor
                    </label>
                  </div>
                </div>

                {formData.isSelfSponsored === 'no' &&
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                    type="text"
                    name="sponsorName"
                    value={formData.sponsorName}
                    onChange={handleChange}
                    placeholder="e.g Jane Doe"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <input
                    type="text"
                    name="sponsorRelationship"
                    value={formData.sponsorRelationship}
                    onChange={handleChange}
                    placeholder="e.g Employer"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                    type="tel"
                    name="sponsorPhone"
                    value={formData.sponsorPhone}
                    onChange={handleChange}
                    placeholder="e.g 0712345678"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                    type="email"
                    name="sponsorEmail"
                    value={formData.sponsorEmail}
                    onChange={handleChange}
                    placeholder="e.g someone@gmail.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City/Town *
                      </label>
                      <input
                    type="text"
                    name="sponsorCity"
                    value={formData.sponsorCity}
                    onChange={handleChange}
                    placeholder="e.g Nairobi"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                  
                    </div>
                  </div>
              }
              </div>

              {/* Schedule & Marketing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule for Classes (Select suitable time) *
                  </label>
                  <select
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Morning (8AM - 10AM)">
                      Morning (8AM - 10AM)
                    </option>
                    <option value="Mid-Morning (10AM - 12PM)">
                      Mid-Morning (10AM - 12PM)
                    </option>
                    <option value="Afternoon (2PM - 4PM)">
                      Afternoon (2PM - 4PM)
                    </option>
                    <option value="Evening (4PM - 6PM)">
                      Evening (4PM - 6PM)
                    </option>
                    <option value="Weekend (Saturday)">
                      Weekend (Saturday)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How did you know about us? *
                  </label>
                  <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Social Media">
                      Social Media (Facebook/Instagram)
                    </option>
                    <option value="Friend/Family">
                      Friend/Family Referral
                    </option>
                    <option value="Website">Website/Google Search</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Sales Person">Sales Person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Sales Person (If applicable)
                  </label>
                  <select
                  name="salesPerson"
                  value={formData.salesPerson}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none">
                  
                    <option value="">--Select--</option>
                    <option value="Agent A">Agent A</option>
                    <option value="Agent B">Agent B</option>
                    <option value="Agent C">Agent C</option>
                  </select>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="flex items-start cursor-pointer">
                  <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-[#2E8B57] rounded border-gray-300 focus:ring-[#2E8B57]" />
                
                  <span className="text-sm text-gray-700">
                    I have read and understood the terms and conditions of
                    enrollment at Lashawn Driving & Computer College.
                  </span>
                </label>
                <label className="flex items-start cursor-pointer">
                  <input
                  type="checkbox"
                  name="privacyAccepted"
                  checked={formData.privacyAccepted}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-[#2E8B57] rounded border-gray-300 focus:ring-[#2E8B57]" />
                
                  <span className="text-sm text-gray-700">
                    I have read and understood the data privacy statement
                    regarding the collection and processing of my personal data.
                  </span>
                </label>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button
                variant="primary"
                onClick={nextStep}
                disabled={
                !formData.kinName ||
                !formData.kinRelationship ||
                !formData.kinPhone ||
                !formData.kinEmail ||
                !formData.kinCity ||
                !formData.schedule ||
                !formData.source ||
                !formData.termsAccepted ||
                !formData.privacyAccepted
                }>
                
                  Proceed to Payment
                </Button>
              </div>
            </div>
          }

          {/* STEP 3: Invoicing & Payment */}
          {step === 3 &&
          <div className="p-6 sm:p-10">
              <div className="mb-8 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Step 3/3 - Invoicing & qaPayment
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Review your application fees and complete payment.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Invoice Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Invoice Summary
                  </h3>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Applicant Name:</span>
                        <span className="font-medium text-gray-900">
                          {formData.studentName || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Course Category:</span>
                        <span className="font-medium text-gray-900">
                          {formData.drivingCategory || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Class Type:</span>
                        <span className="font-medium text-gray-900">
                          {formData.drivingClass || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Registration Fee:</span>
                        <span className="font-medium text-gray-900">
                          KSh 1,500
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tuition Fee:</span>
                        <span className="font-medium text-gray-900">
                          KSh {(getInvoiceTotal() - 1500).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-800">
                          Total Amount:
                        </span>
                        <span className="text-xl font-bold text-[#2E8B57]">
                          KSh {getInvoiceTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <AlertCircle
                    size={20}
                    className="mr-2 flex-shrink-0 mt-0.5" />
                    <p>
                      You can pay the full amount now or a minimum deposit of
                      30% to secure your spot. The balance can be paid in
                      installments.
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Select Payment Method
                  </h3>

                  <div className="space-y-4 mb-8">
                    <label
                    className={`block relative border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'mpesa' ? 'border-[#2E8B57] bg-green-50/50 ring-1 ring-[#2E8B57]' : 'border-gray-200 hover:border-gray-300'}`}>
                    
                      <div className="flex items-center">
                        <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={paymentMethod === 'mpesa'}
                        onChange={() => setPaymentMethod('mpesa')}
                        className="h-4 w-4 text-[#2E8B57] focus:ring-[#2E8B57]" />
                      
                        <div className="ml-3 flex items-center">
                          <Smartphone className="h-6 w-6 text-[#2E8B57] mr-2" />
                          <span className="font-medium text-gray-900">
                            M-Pesa (Lipa na M-Pesa)
                          </span>
                        </div>
                      </div>
                      {paymentMethod === 'mpesa' &&
                    <div className="mt-4 ml-7 pl-2 border-l-2 border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">
                            Enter your M-Pesa number to receive a payment prompt
                            on your phone.
                          </p>
                          <input
                        type="tel"
                        defaultValue={formData.phone}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none" />
                      
                        </div>
                    }
                    </label>

                    <label
                    className={`block relative border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-[#2E8B57] bg-green-50/50 ring-1 ring-[#2E8B57]' : 'border-gray-200 hover:border-gray-300'}`}>
                    
                      <div className="flex items-center">
                        <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="h-4 w-4 text-[#2E8B57] focus:ring-[#2E8B57]" />
                      
                        <div className="ml-3 flex items-center">
                          <CreditCard className="h-6 w-6 text-gray-600 mr-2" />
                          <span className="font-medium text-gray-900">
                            Credit / Debit Card
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <div className="mb-4">
                      {(() => {
                        const total = getInvoiceTotal();
                        const min = Math.ceil(total * 0.3);
                        return (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount to Pay (KSh) - Minimum KSh {min.toLocaleString()}
                            </label>
                            <input
                              type="number"
                              min={min}
                              value={paymentAmount === '' ? total : paymentAmount}
                              onChange={(e) => setPaymentAmount(Number(e.target.value))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none"
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {showCardForm ? (
                      <div className="pt-4">
                        <div className="space-y-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name on Card *
                            </label>
                            <input
                              type="text"
                              value={billingDetails.name}
                              onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                              required
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none"
                              placeholder="Enter name as it appears on card"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Billing Address *
                            </label>
                            <input
                              type="text"
                              value={billingDetails.address.line1}
                              onChange={(e) => setBillingDetails(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))}
                              required
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none mb-2"
                              placeholder="Street address"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={billingDetails.address.city}
                                onChange={(e) => setBillingDetails(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                                required
                                className="rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none"
                                placeholder="City"
                              />
                              <input
                                type="text"
                                value={billingDetails.address.state}
                                onChange={(e) => setBillingDetails(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                                required
                                className="rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none"
                                placeholder="State/Province"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <input
                                type="text"
                                value={billingDetails.address.postal_code}
                                onChange={(e) => setBillingDetails(prev => ({ ...prev, address: { ...prev.address, postal_code: e.target.value } }))}
                                required
                                className="rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none"
                                placeholder="Postal Code"
                              />
                              <select
                                value={billingDetails.address.country}
                                onChange={(e) => setBillingDetails(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))}
                                required
                                className="rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:ring-1 focus:ring-[#2E8B57] outline-none"
                              >
                                <option value="KE">Kenya</option>
                                <option value="US">United States</option>
                                <option value="GB">United Kingdom</option>
                                <option value="CA">Canada</option>
                                <option value="AU">Australia</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <StripeCardForm
                          amount={paymentAmount === '' ? getInvoiceTotal() : Number(paymentAmount)}
                          registrationNumber={registrationNumber}
                          email={formData.email}
                          billingDetails={billingDetails}
                          onSuccess={handleCardSuccess}
                          onError={(err) => alert('Card payment failed: ' + (err?.message || JSON.stringify(err)))}
                        />
                        <div className="mt-4">
                          <Button type="button" variant="outline" onClick={() => setShowCardForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handlePayment}>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          disabled={isSubmitting}>
                          
                            Back
                          </Button>
                          <Button
                          type="submit"
                          variant="primary"
                          disabled={isSubmitting || (paymentAmount !== '' && paymentAmount < Math.ceil(getInvoiceTotal() * 0.3))}
                          className="min-w-[150px]">
                          
                            {isSubmitting ? 'Processing...' : `Pay KSh ${(paymentAmount === '' ? getInvoiceTotal() : paymentAmount).toLocaleString()}`}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }

          {/* STEP 4: Receipt (Printable Area) */}
          {step === 4 &&
          <div className="p-0 sm:p-10 print:p-0">
              {/* Success Message - Hidden on Print */}
              <div className="text-center mb-10 print:hidden p-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Registration Successful!
                </h2>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  Your payment has been received and your registration is
                  complete. Please save your registration number.
                </p>
                {/* Registration Number Card */}
                <div className="inline-flex items-center bg-[#2E8B57]/10 border-2 border-[#2E8B57] rounded-lg px-6 py-3 mb-6">
                  <div className="text-left mr-4">
                    <p className="text-xs font-medium text-[#2E8B57] uppercase tracking-wider">
                      Your Registration No.
                    </p>
                    <p className="text-2xl font-bold text-[#2E8B57] tracking-widest">
                      {registrationNumber}
                    </p>
                  </div>
                  <button
                  onClick={copyRegNumber}
                  className="p-2 rounded-md hover:bg-[#2E8B57]/10 transition-colors"
                  title="Copy to clipboard">
                  
                    <Copy className="h-5 w-5 text-[#2E8B57]" />
                  </button>
                </div>
                <div className="mt-4">
                  <Button variant="primary" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Download Receipt
                  </Button>
                </div>
              </div>

              {/* Actual Receipt - Shown on screen and print */}
              <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-8 print:shadow-none print:border-none print:p-0">
                {/* Receipt Header */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#2E8B57] mb-1">
                      Lashawn
                    </h1>
                    <p className="text-sm text-gray-600">
                      Driving & Computer College
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Along Eldoret Roadblock
                      <br />
                      Opposite Khetias Supermarket
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800 tracking-wider">
                      RECEIPT
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Receipt No:{' '}
                      <span className="font-medium">{transactionId}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: <span className="font-medium">{currentDate}</span>
                    </p>
                  </div>
                </div>

                {/* Registration Number Banner */}
                <div className="bg-[#2E8B57]/5 border border-[#2E8B57]/20 rounded-lg p-4 mb-6 text-center">
                  <p className="text-xs font-semibold text-[#2E8B57] uppercase tracking-wider mb-1">
                    Registration Number
                  </p>
                  <p className="text-xl font-bold text-[#2E8B57] tracking-widest">
                    {registrationNumber}
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#2E8B57]/20">
                    <p className="text-sm text-gray-700">
                      Use this registration number to log in to the Student Portal.
                    </p>
                    {tempPassword ? (
                      <div className="mt-2 text-left">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Login:</span> {registrationNumber}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Temporary password:</span> {tempPassword}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Please change your password after first login.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 mt-1">Credentials will be created once payment is confirmed.</p>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Billed To
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {formData.studentName}
                      </p>
                      <p className="text-gray-600">ID: {formData.idNumber}</p>
                      <p className="text-gray-600">{formData.phone}</p>
                      <p className="text-gray-600">{formData.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Branch:
                        </span>{' '}
                        {formData.branch}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Schedule:
                        </span>{' '}
                        {formData.schedule}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <table className="w-full mb-8 text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-3 font-semibold text-gray-800">
                        Description
                      </th>
                      <th className="pb-3 font-semibold text-gray-800 text-right">
                        Amount (KSh)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-3">Registration Fee</td>
                      <td className="py-3 text-right">1,500.00</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3">
                        <p className="font-medium text-gray-800">
                          {formData.drivingCategory}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formData.drivingClass}
                        </p>
                      </td>
                      <td className="py-3 text-right">
                        {(getInvoiceTotal() - 1500).toLocaleString()}.00
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-4 pb-2 text-right font-bold text-gray-800">
                        Total Paid:
                      </td>
                      <td className="pt-4 pb-2 text-right font-bold text-[#2E8B57] text-lg">
                        {(paymentAmount === '' ? getInvoiceTotal() : paymentAmount).toLocaleString()}.00
                      </td>
                    </tr>
                    <tr>
                      <td className="pb-2 text-right font-medium text-gray-600">
                        Payment Method:
                      </td>
                      <td className="pb-2 text-right text-gray-800 uppercase">
                        {paymentMethod}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
                  <p className="mb-1 font-medium text-gray-700">
                    Thank you for choosing Lashawn Driving & Computer College!
                  </p>
                  <p>
                    For any inquiries, please contact us at +254 117 564 318 or
                    lashawnlimited@gmail.com
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center print:hidden">
                <Button variant="outline" to="/">
                  Return to Home
                </Button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>);

}