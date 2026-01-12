import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { languageService } from '../services/languageService';
import type { Language } from '../services/languageService';

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>(languageService.getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);
  const languages = languageService.getAvailableLanguages();

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLang(languageService.getCurrentLanguage());
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    languageService.setLanguage(lang);
    setCurrentLang(lang);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === currentLang);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-[#0072CE] transition-all"
      >
        <Globe className="w-5 h-5 text-[#0072CE]" />
        <span className="text-2xl">{currentLanguage?.flag}</span>
        <span className="font-semibold text-gray-700">{currentLanguage?.name}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50"
            >
              <div className="p-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                <p className="font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Select Language
                </p>
              </div>

              <div className="p-2">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ x: 5 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      currentLang === lang.code
                        ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    {currentLang === lang.code && (
                      <Check className="w-5 h-5" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Language preference is saved locally
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
