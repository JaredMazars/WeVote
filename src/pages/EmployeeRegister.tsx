import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';

interface EmployeeFormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  dateOfBirth: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  goodStandingIdNumber: string;
  idType: string;
}

const EmployeeRegister: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState<EmployeeFormData>({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    dateOfBirth: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    idType: '',
    goodStandingIdNumber: ''
  });

  const totalSteps = 3;

  const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.idType) newErrors.idType = 'ID type is required';
        if (!formData.idNumber) newErrors.idNumber = 'ID number is required';
        if (!formData.goodStandingIdNumber)
          newErrors.goodStandingIdNumber = 'Membership number is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }

        const phoneRegex = /^0\d{9}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
          newErrors.phone = 'Phone number must be 10 digits, start with 0, and contain only numbers';
        }

        if (formData.idType === 'south_african') {
          const idRegex = /^\d{13}$/;
          if (formData.idNumber && !idRegex.test(formData.idNumber)) {
            newErrors.idNumber = 'South African ID must be exactly 13 digits';
          }
        }
        break;

      case 2:
        if (!formData.streetAddress) newErrors.streetAddress = 'Street address is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.province) newErrors.province = 'Province is required';
        if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';
        if (!formData.country) newErrors.country = 'Country is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!selectedOptions.length) {
      alert('Please select a proxy vote option.');
      return;
    }

    setLoading(true);

    try {
      const proxyVoteForm =
        selectedOptions[0] === 'digital'
          ? 'digital'
          : selectedOptions[0] === 'manual'
          ? 'manual'
          : 'abstain';

      const payload = {
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        idNumber: formData.idNumber,
        idType: formData.idType,
        dateOfBirth: formData.dateOfBirth,
        streetAddress: formData.streetAddress,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        country: formData.country,
        goodStandingIdNumber: formData.goodStandingIdNumber,
        proxyVoteForm: proxyVoteForm
      };

      console.log('📤 Registration payload:', JSON.stringify(payload, null, 2));

      // Call backend API to register pending user
      const response = await fetch('http://localhost:3001/api/auth/register-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed error message from backend
        const errorMessage = result.message || result.error || 
                           (result.errors ? JSON.stringify(result.errors) : '') ||
                           'Registration failed. Please try again.';
        console.error('Registration error response:', result);
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(result.message || 'Registration failed. Please try again.');
      }

      console.log('✅ Registration successful:', result);

      // Store proxy choice for later use (after approval)
      localStorage.setItem(`proxyChoice_${formData.email}`, proxyVoteForm);
      
      if (proxyVoteForm === 'digital') {
        localStorage.setItem(`needsProxy_${formData.email}`, 'true');
      } else if (proxyVoteForm === 'manual') {
        localStorage.setItem(`needsManualUpload_${formData.email}`, 'true');
      }

      alert(
        '✅ Registration Submitted Successfully!\n\n' +
        'Your registration is pending admin approval.\n' +
        'You will receive an email with your login credentials once your account is approved.\n\n' +
        'Please check your email for further instructions.'
      );

      setTimeout(() => {
        navigate('/login', { 
          state: { 
            email: formData.email,
            pendingApproval: true
          } 
        });
      }, 2000);

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Show user-friendly error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please ensure the backend server is running on http://localhost:3001';
      }
      
      alert(`❌ ${errorMessage}\n\nPlease check:\n- Backend server is running\n- All required fields are filled\n- Email format is correct\n- Phone number is valid`);
    } finally {
      setLoading(false);
    }
  };

  const handleProxyChoice = (choice: 'manual' | 'digital' | 'abstain') => {
    localStorage.setItem('passwordChange', 'true');

    if (choice === 'manual') {
      const email = formData?.email || '';
      if (email) {
        localStorage.setItem(`proxyChoice_${email}`, 'manual');
      }
      return;
    }

    if (choice === 'digital') {
      const email = formData?.email || '';
      if (email) {
        localStorage.setItem(`needsProxy_${email}`, 'true');
        localStorage.setItem(`proxyChoice_${email}`, 'digital');
      }
      return;
    }

    if (choice === 'abstain') {
      const email = formData?.email || '';
      if (email) {
        localStorage.setItem(`proxyChoice_${email}`, 'abstain');
      }
      return;
    }
  };

  const handleCheckboxChange = (value: string) => {
    setSelectedOptions(prev => {
      const isChecked = !prev.includes(value);

      if (isChecked) {
        if (value === 'manual') {
          const link = document.createElement('a');
          link.href = '/dummy-proxy-form.pdf';
          link.download = 'Proxy_Form_Manual.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        handleProxyChoice(value as 'manual' | 'digital' | 'abstain');
        return [...prev, value];
      } else {
        return prev.filter(v => v !== value);
      }
    });
  };

  const censorText = (text: string, show: boolean = false): string => {
    if (show || !text) return text;
    return '*'.repeat(Math.min(text.length, 8));
  };

  const options = [
    {
      value: 'digital',
      title: 'Fill Digitally',
      description: 'Complete the form online after admin approval',
      icon: <FileText className="h-6 w-6" />,
      bg: 'bg-blue-600',
      text: 'text-white',
      hover: 'hover:bg-blue-700'
    },
    {
      value: 'manual',
      title: 'Download Manual Form',
      description: 'Print and fill out the form manually',
      icon: <Download className="h-6 w-6" />,
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      hover: 'hover:bg-gray-200'
    },
    {
      value: 'abstain',
      title: 'Abstain from Proxy Voting',
      description: 'Skip proxy assignment for now',
      icon: <AlertCircle className="h-6 w-6" />,
      bg: 'bg-red-100',
      text: 'text-red-900',
      hover: 'hover:bg-red-200'
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <select
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
                <select
                  value={formData.idType || ''}
                  onChange={e => handleInputChange('idType', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.idType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select ID Type</option>
                  <option value="south_african">South African ID</option>
                  <option value="foreign">Foreign ID/Passport</option>
                </select>
                {errors.idType && <p className="text-red-500 text-sm mt-1">{errors.idType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.idType === 'foreign' ? 'Foreign ID/Passport Number' : 'ID Number'} *{' '}
                  {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                </label>
                <input
                  type="text"
                  value={censorText(formData.idNumber, showSensitiveData)}
                  onChange={e => handleInputChange('idNumber', e.target.value)}
                  disabled={!showSensitiveData}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.idNumber ? 'border-red-500' : 'border-gray-300'
                  } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                  placeholder={
                    formData.idType === 'foreign'
                      ? 'Enter foreign ID or passport number'
                      : 'Enter 13-digit SA ID number'
                  }
                />
                {errors.idNumber && <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>}
                {formData.idType === 'south_african' && (
                  <p className="text-xs text-gray-500 mt-1">Must be exactly 13 digits</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Number *{' '}
                  {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                </label>
                <input
                  type="text"
                  value={censorText(formData.goodStandingIdNumber, showSensitiveData)}
                  onChange={e => handleInputChange('goodStandingIdNumber', e.target.value)}
                  disabled={!showSensitiveData}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.goodStandingIdNumber ? 'border-red-500' : 'border-gray-300'
                  } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                  placeholder="Enter Good Standing ID number"
                />
                {errors.goodStandingIdNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.goodStandingIdNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
              <p className="text-gray-600">Where can we reach you?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={e => handleInputChange('streetAddress', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.streetAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter street address"
                />
                {errors.streetAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
                  <select
                    value={formData.province}
                    onChange={e => handleInputChange('province', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.province ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Province</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="North West">North West</option>
                    <option value="Western Cape">Western Cape</option>
                  </select>
                  {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={e => handleInputChange('postalCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter postal code"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={e => handleInputChange('country', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter country"
                  />
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Almost Done!</h2>
              <p className="text-gray-600">
                Would you like to fill out the proxy assignment form?
              </p>
            </div>

            <div className="space-y-4">
              {options.map(option => (
                <label
                  key={option.value}
                  className={`w-full p-6 rounded-xl transition-colors flex items-center justify-between group cursor-pointer border ${
                    selectedOptions.includes(option.value)
                      ? 'border-blue-600 ring-2 ring-blue-300'
                      : 'border-transparent'
                  } ${option.bg} ${option.text} ${option.hover}`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={selectedOptions.includes(option.value)}
                      onChange={() => handleCheckboxChange(option.value)}
                      className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <h3 className="text-xl font-bold">{option.title}</h3>
                      <p className="text-sm opacity-80">{option.description}</p>
                    </div>
                  </div>
                  <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </label>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Note:</p>
                  <p className="text-sm text-blue-700">
                    {selectedOptions.includes('digital') &&
                      'After admin approval, you can complete the proxy form from your dashboard.'}
                    {selectedOptions.includes('manual') &&
                      'After admin approval, you can upload your completed manual form.'}
                    {selectedOptions.includes('abstain') &&
                      'You can always change this decision later.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate('/login')}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Login</span>
          </motion.button>

          {currentStep < 3 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Employee Registration</h1>
                  <p className="text-gray-600 mt-2">
                    Complete your profile to access the voting platform
                  </p>
                </div>

                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                >
                  {showSensitiveData ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
                  </span>
                </button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500 mb-8">
                <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>
                  Personal Info
                </span>
                <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>
                  Address
                </span>
                <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>
                  Proxy Form
                </span>
              </div>
            </>
          )}
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          {renderStepContent()}
        </motion.div>

        {currentStep <= 3 && (
          <div className="flex justify-between mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </motion.button>

            {currentStep < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRegister;
