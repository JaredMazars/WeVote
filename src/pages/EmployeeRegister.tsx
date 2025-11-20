import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Award, 
  Star, 
  Plus, 
  Trash2, 
  Save,
  Building,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import apiService from '../services/api';

interface Skill {
  skill_name: string;
  proficiency_level: string;
  years_experience: number;
  certified: boolean;
}

interface Achievement {
  title: string;
  description: string;
  achievement_date: string;
  category: string;
  points: number;
}

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
}

const EmployeeRegister: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    position: '',
    department_id: '',
    bio: '',
    hire_date: '',
    salary: '',
    manager_id: '',
    password: '' // <-- Add this line
  });
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: "Engineering" },
    { id: 2, name: "Marketing" },
    { id: 3, name: "Sales" },
    { id: 4, name: "HR" },
    { id: 5, name: "Finance" },
    { id: 6, name: "IT Support" }
  ]);
  const [managers, setManagers] = useState<Employee[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // loadInitialData();
  }, []);

//   const loadInitialData = async () => {
//     try {
//       const [deptResponse, managersResponse] = await Promise.all([
//         apiService.getDepartments(),
//         apiService.getManagers()
//       ]);
      
//       if (deptResponse.success) {
//         setDepartments(deptResponse.data);
//       }
      
//       if (managersResponse.success) {
//         setManagers(managersResponse.data);
//       }
//     } catch (error) {
//       console.error('Error loading initial data:', error);
//     }
//   };

  const addSkill = () => {
    setSkills([...skills, {
      skill_name: '',
      proficiency_level: 'intermediate',
      years_experience: 0,
      certified: false
    }]);
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setSkills(updatedSkills);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    setAchievements([...achievements, {
      title: '',
      description: '',
      achievement_date: '',
      category: 'other',
      points: 0
    }]);
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: any) => {
    const updatedAchievements = [...achievements];
    updatedAchievements[index] = { ...updatedAchievements[index], [field]: value };
    setAchievements(updatedAchievements);
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const employeeData = {
        ...formData,
        department_id: parseInt(formData.department_id),
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        skills,
        achievements
      };

      // Only include password if not blank
      if (formData.password && user?.id) {
        await apiService.updatePassword(user.id.toString(), formData.password);
      }

      const response = await apiService.registerEmployee(employeeData);
      console.log('API Response:', response);
      if (response.success) {
        setSuccess('Employee profile created successfully!');
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        setError(response.message || 'Failed to create employee profile');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create employee profile');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const achievementCategories = ['technical', 'leadership', 'innovation', 'teamwork', 'customer_service', 'other'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Complete Your Employee Profile</h1>
                <p className="text-white/80">Welcome {user?.name}! Let's set up your employee details.</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6 flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-white text-[#0072CE]' : 'bg-white/20 text-white'
                  }`}>
                    {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-white' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
              >
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-[#464B4B] mb-6">Basic Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#464B4B] mb-2">
                        <Briefcase className="inline h-4 w-4 mr-2" />
                        Position/Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#464B4B] mb-2">
                        <Building className="inline h-4 w-4 mr-2" />
                        Department *
                      </label>
                      <select
                        required
                        value={formData.department_id}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#464B4B] mb-2">
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Hire Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.hire_date}
                        onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#464B4B] mb-2">
                        <Users className="inline h-4 w-4 mr-2" />
                        Manager (Optional)
                      </label>
                      <select
                        value={formData.manager_id}
                        onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>{manager.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-[#464B4B] mb-2">
                        <DollarSign className="inline h-4 w-4 mr-2" />
                        Salary (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salary}
                        onChange={(e) => setFormData({...formData, salary: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                        placeholder="e.g., 75000.00"
                      />
                    </div> */}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      Bio/About Me
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                      placeholder="Tell us about yourself, your experience, and what you bring to the team..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      Password (Update)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep your current password.</p>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Skills */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#464B4B]">Skills & Expertise</h2>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#0072CE] text-white rounded-lg hover:bg-[#005bb5] transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Skill</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {skills.map((skill, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-[#464B4B]">Skill #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Skill Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={skill.skill_name}
                              onChange={(e) => updateSkill(index, 'skill_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                              placeholder="e.g., JavaScript, Project Management"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Proficiency Level
                            </label>
                            <select
                              value={skill.proficiency_level}
                              onChange={(e) => updateSkill(index, 'proficiency_level', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                            >
                              {proficiencyLevels.map((level) => (
                                <option key={level} value={level}>
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Years of Experience
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={skill.years_experience}
                              onChange={(e) => updateSkill(index, 'years_experience', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`certified-${index}`}
                              checked={skill.certified}
                              onChange={(e) => updateSkill(index, 'certified', e.target.checked)}
                              className="w-4 h-4 text-[#0072CE] border-gray-300 rounded focus:ring-[#0072CE]"
                            />
                            <label htmlFor={`certified-${index}`} className="text-sm text-[#464B4B]">
                              Certified
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {skills.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No skills added yet. Click "Add Skill" to get started!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Achievements */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#464B4B]">Achievements & Awards</h2>
                    <button
                      type="button"
                      onClick={addAchievement}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#0072CE] text-white rounded-lg hover:bg-[#005bb5] transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Achievement</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-[#464B4B]">Achievement #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeAchievement(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              required
                              value={achievement.title}
                              onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                              placeholder="e.g., Employee of the Month"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={achievement.achievement_date}
                              onChange={(e) => updateAchievement(index, 'achievement_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Category
                            </label>
                            <select
                              value={achievement.category}
                              onChange={(e) => updateAchievement(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                            >
                              {achievementCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#464B4B] mb-1">
                              Points
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={achievement.points}
                              onChange={(e) => updateAchievement(index, 'points', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#464B4B] mb-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={achievement.description}
                            onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0072CE] focus:outline-none"
                            placeholder="Describe this achievement..."
                          />
                        </div>
                      </motion.div>
                    ))}

                    {achievements.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No achievements added yet. Click "Add Achievement" to showcase your accomplishments!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex space-x-4">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-3 bg-[#0072CE] text-white rounded-xl hover:bg-[#005bb5] transition-colors"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          <span>Creating Profile...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span>Complete Registration</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeRegister;