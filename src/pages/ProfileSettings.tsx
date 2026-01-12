import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, CheckCircle, User, Mail, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { languageService } from '../services/languageService';
import type { Language } from '../services/languageService';

interface UserProfile {
  name: string;
  email: string;
  department: string;
  language: Language;
}

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    department: '',
    language: languageService.getCurrentLanguage()
  });
  const [savedLanguage, setSavedLanguage] = useState<Language>(profile.language);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const availableLanguages = languageService.getAvailableLanguages();
  const categories = ['All', ...new Set(availableLanguages.map(lang => lang.category))];

  // Load user profile from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const storedLanguage = localStorage.getItem('language') as Language || 'en';
      
      setProfile({
        name: userData.name || 'Demo User',
        email: userData.email || 'demo@wevote.com',
        department: userData.department || 'General',
        language: storedLanguage
      });
      setSavedLanguage(storedLanguage);
    }
  }, []);

  const handleLanguageChange = (newLanguage: Language) => {
    setProfile(prev => ({ ...prev, language: newLanguage }));
  };

  const handleSave = () => {
    // Save language preference
    languageService.setLanguage(profile.language);
    setSavedLanguage(profile.language);
    
    // Update user profile in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userData.language = profile.language;
      localStorage.setItem('user', JSON.stringify(userData));
    }

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const hasChanges = profile.language !== savedLanguage;

  const filteredLanguages = selectedCategory === 'All' 
    ? availableLanguages 
    : availableLanguages.filter(lang => lang.category === selectedCategory);

  const t = (key: string) => languageService.t(key);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#464B4B] hover:text-[#0072CE] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.back')}</span>
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent">
            {t('common.settings')}
          </h1>
          <p className="text-[#464B4B] mt-2">
            {t('common.profile')} & Language Preferences
          </p>
        </motion.div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-green-800 font-medium">
              {t('messages.success')}! Language preference saved.
            </span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-[#171C8F] mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('common.profile')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#464B4B] font-medium flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Name
                  </label>
                  <div className="px-4 py-3 bg-[#F4F4F4] rounded-xl text-[#464B4B]">
                    {profile.name}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#464B4B] font-medium flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <div className="px-4 py-3 bg-[#F4F4F4] rounded-xl text-[#464B4B]">
                    {profile.email}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#464B4B] font-medium flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    Department
                  </label>
                  <div className="px-4 py-3 bg-[#F4F4F4] rounded-xl text-[#464B4B]">
                    {profile.department}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Language Preferences Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-[#171C8F] mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language Preferences
              </h2>

              {/* Current Language */}
              <div className="mb-6 p-4 bg-gradient-to-r from-[#0072CE]/10 to-[#171C8F]/10 rounded-2xl">
                <p className="text-sm text-[#464B4B] mb-1">Current Language:</p>
                <p className="text-lg font-bold text-[#171C8F]">
                  {availableLanguages.find(l => l.code === profile.language)?.flag} {' '}
                  {availableLanguages.find(l => l.code === profile.language)?.name}
                </p>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <p className="text-sm text-[#464B4B] font-medium mb-3">Filter by Region:</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category || 'All')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                          : 'bg-[#F4F4F4] text-[#464B4B] hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredLanguages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      profile.language === lang.code
                        ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                        : 'bg-[#F4F4F4] hover:bg-gray-200 text-[#464B4B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <p className="font-semibold">{lang.name}</p>
                          <p className={`text-sm ${
                            profile.language === lang.code ? 'text-white/80' : 'text-[#464B4B]/70'
                          }`}>
                            {lang.category}
                          </p>
                        </div>
                      </div>
                      {profile.language === lang.code && (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!hasChanges}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  hasChanges
                    ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] shadow-xl hover:shadow-2xl'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <Save className="w-5 h-5" />
                {t('common.save')} {t('common.settings')}
              </motion.button>

              {hasChanges && (
                <p className="text-center text-sm text-[#464B4B] mt-3">
                  You have unsaved changes
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl"
        >
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Changing your language preference will update the interface for all WeVote pages. 
            The language setting is saved to your profile and will persist across sessions.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;
