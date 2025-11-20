import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Download,
  X
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
  bio: string;
  skills: Array<{
    skill_name: string;
    proficiency_level: string;
    years_experience: number;
    certified: boolean;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    achievement_date: string;
    category: string;
    points: number;
  }>;
  goodStandingIdNumber: string;
  idType: string; 
}

const EmployeeRegister: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');
  const [newSkillYears, setNewSkillYears] = useState(0);
  const [newSkillCertified, setNewSkillCertified] = useState(false);
  const [newAchievement, setNewAchievement] = useState('');
  const [newAchievementDesc, setNewAchievementDesc] = useState('');
  const [newAchievementCategory, setNewAchievementCategory] = useState('other');
  const [newAchievementPoints, setNewAchievementPoints] = useState(0);
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
    bio: '',
    skills: [],
    achievements: [],
    goodStandingIdNumber: ''
  });

  const totalSteps = 4;

  const departments = [
    { id: 1, name: 'Human Resources' },
    { id: 2, name: 'Finance' },
    { id: 3, name: 'Information Technology' },
    { id: 4, name: 'Marketing' },
    { id: 5, name: 'Sales' },
    { id: 6, name: 'Operations' },
    { id: 7, name: 'Legal' },
    { id: 8, name: 'Administration' }
  ];

  const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDepartmentChange = (deptName: string) => {
    const dept = departments.find(d => d.name === deptName);
    setFormData(prev => ({
      ...prev,
      department: deptName,
      departmentId: dept?.id || 0
    }));
    if (errors.department) {
      setErrors(prev => ({ ...prev, department: '' }));
    }
  };

  const handleAddSkill = () => {
    if (formData.skills.length >= 3) {
      alert("Maximum 3 skills can be added");
      return;
    }
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, {
          skill_name: newSkill.trim(),
          proficiency_level: newSkillLevel,
          years_experience: newSkillYears,
          certified: newSkillCertified
        }]
      }));
      setNewSkill('');
      setNewSkillLevel('intermediate');
      setNewSkillYears(0);
      setNewSkillCertified(false);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleAddAchievement = () => {
    if (formData.achievements.length >= 3) {
      alert("Maximum 3 achievements can be added");
      return;
    }
    if (newAchievement.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, {
          title: newAchievement.trim(),
          description: newAchievementDesc.trim(),
          achievement_date: new Date().toISOString().split('T')[0],
          category: newAchievementCategory,
          points: newAchievementPoints
        }]
      }));
      setNewAchievement('');
      setNewAchievementDesc('');
      setNewAchievementCategory('other');
      setNewAchievementPoints(0);
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  // Utility function for Luhn algorithm
// const isValidLuhn = (id: string): boolean => {
//   let sum = 0;
//   let shouldDouble = false;

//   // Process digits from right to left
//   for (let i = id.length - 1; i >= 0; i--) {
//     let digit = parseInt(id[i], 10);

//     if (shouldDouble) {
//       digit *= 2;
//       if (digit > 9) digit -= 9;
//     }

//     sum += digit;
//     shouldDouble = !shouldDouble;
//   }

//   return sum % 10 === 0;
// };

const validateStep = (step: number): boolean => {
  const newErrors: Record<string, string> = {};

  switch (step) {
    case 1:
      // Required fields
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.idType) newErrors.idType = 'ID type is required';
      if (!formData.idNumber) newErrors.idNumber = 'ID number is required';
      if (!formData.goodStandingIdNumber) newErrors.goodStandingIdNumber = 'Membership number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      // Phone validation (South Africa: 10 digits, starts with 0)
      const phoneRegex = /^0\d{9}$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Phone number must be 10 digits, start with 0, and contain only numbers';
      }

      // ID validation (South African ID: exactly 13 digits + Luhn check)
      if (formData.idType === 'south_african') {
        const idRegex = /^\d{13}$/;
        if (formData.idNumber && !idRegex.test(formData.idNumber)) {
          newErrors.idNumber = 'South African ID must be exactly 13 digits';
        } 
        // else if (!isValidLuhn(formData.idNumber)) {
        //   newErrors.idNumber = 'Invalid South African ID (failed Luhn check)';
        // }
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
  for (let step = 1; step <= 4; step++) {
    if (!validateStep(step)) {
      setCurrentStep(step);
      return;
    }
  }

  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    alert('Please enter a valid email address.');
    return;
  }

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
      initials: `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`,
      id_number: formData.idNumber,
      id_type: formData.idType,
      name: formData.firstName,
      lastname: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.dateOfBirth,
      street_address: formData.streetAddress,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      country: formData.country,
      bio: formData.bio || null,
      skills: formData.skills,
      achievements: formData.achievements,
      good_standing_id_number: formData.goodStandingIdNumber,
      proxy_vote_form: proxyVoteForm
    };

    // ✅ Log payload before sending
    console.log('📤 Sending registration payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('http://localhost:3001/api/employees/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('📥 Response from server:', data);

    if (response.ok && data.success) {
      console.log('✅ Registration successful:', data);
      setCurrentStep(4);

      alert('✅ Your registration request will be reviewed by our team and we’ll get back to you shortly.');

      setTimeout(() => {
        navigate('/login', {
          state: {
            showProxyFormOnLogin: true,
            userEmail: formData.email
          }
        });
      }, 5000);
    } else {
      throw new Error(data.message || 'Registration failed');
    }

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    alert(error.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const handleProxyChoice = (choice: 'manual' | 'digital' | 'abstain') => {
    localStorage.setItem('passwordChange', 'true');

    if (choice === 'manual') {
      return;
    }

    if (choice === 'digital') {
      const email = formData?.email || '';
      if (email) {
        localStorage.setItem(`needsProxy_${email}`, 'true');
        localStorage.setItem('proxyChoice', 'digital');
      }
      return;
    }
  };

  const handleCheckboxChange = (value: string) => {
    setSelectedOptions((prev) => {
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
        return prev.filter((v) => v !== value);
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
      description: 'Complete the form online after login',
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
                  onChange={(e) => handleInputChange('title', e.target.value)}
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
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
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
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
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
                  onChange={(e) => handleInputChange('idType', e.target.value)}
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
                  {formData.idType === 'foreign' ? 'Foreign ID/Passport Number' : 'ID Number'} * {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                </label>
                <input
                  type="number"
                  value={censorText(formData.idNumber, showSensitiveData)}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  disabled={!showSensitiveData}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.idNumber ? 'border-red-500' : 'border-gray-300'
                  } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                  placeholder={formData.idType === 'foreign' ? 'Enter foreign ID or passport number' : 'Enter 13-digit SA ID number'}
                />
                {errors.idNumber && <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>}
                {formData.idType === 'south_african' && (
                  <p className="text-xs text-gray-500 mt-1">Must be exactly 13 digits</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Number * {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                </label>
                <input
                  type="text"
                  value={censorText(formData.goodStandingIdNumber, showSensitiveData)}
                  onChange={(e) => handleInputChange('goodStandingIdNumber', e.target.value)}
                  disabled={!showSensitiveData}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.goodStandingIdNumber ? 'border-red-500' : 'border-gray-300'
                  } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                  placeholder="Enter Good Standing ID number"
                />
                {errors.goodStandingIdNumber && <p className="text-red-500 text-sm mt-1">{errors.goodStandingIdNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.streetAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter street address"
                />
                {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                  <select
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter postal code"
                  />
                  {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
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
              <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Portfolio Info</h2>
              <p className="text-gray-600">Final details to complete your profile</p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-4">Additional Information (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills (Max 3)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Skill name"
                      />
                      <select
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      <input
                        type="number"
                        value={newSkillYears}
                        onChange={(e) => setNewSkillYears(parseInt(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Years experience"
                        min="0"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newSkillCertified}
                          onChange={(e) => setNewSkillCertified(e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Certified</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Skill
                    </button>
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {skill.skill_name} ({skill.proficiency_level})
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(index)}
                              className="hover:text-blue-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievements (Max 3)</label>
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Achievement title"
                      />
                      <textarea
                        value={newAchievementDesc}
                        onChange={(e) => setNewAchievementDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description (optional)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={newAchievementCategory}
                          onChange={(e) => setNewAchievementCategory(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="award">Award</option>
                          <option value="certification">Certification</option>
                          <option value="milestone">Milestone</option>
                          <option value="recognition">Recognition</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={newAchievementPoints}
                          onChange={(e) => setNewAchievementPoints(parseInt(e.target.value) || 0)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Points"
                          min="0"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAchievement}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Achievement
                    </button>
                    {formData.achievements.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {formData.achievements.map((achievement, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg group hover:bg-green-100 transition-colors"
                          >
                            <div>
                              <span className="text-sm text-green-800 font-medium">{achievement.title}</span>
                              <span className="text-xs text-green-600 ml-2">({achievement.category})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAchievement(index)}
                              className="text-green-600 hover:text-green-800 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-600">
                Would you like to fill out the proxy assignment form now?
              </p>
            </div>

            <div className="space-y-4">
              {options.map((option) => (
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
                    You can always fill out the proxy form later from your dashboard.
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

          {currentStep < 4 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Candidate Registration</h1>
                  <p className="text-gray-600 mt-2">Complete your profile to access the voting platform</p>
                </div>

                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                >
                  {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="text-sm">{showSensitiveData ? 'Hide' : 'Show'} Sensitive Data</span>
                </button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500 mb-8">
                <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Personal Info</span>
                <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Address</span>
                <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Achievements & Skills</span>
                <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>Proxy Form</span>
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

        {currentStep <= 4 && (
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

            {currentStep < 4 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
