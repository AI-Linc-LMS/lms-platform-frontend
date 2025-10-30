import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const isRTL = i18n.language === 'ar';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative">
        <button className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 transition-all duration-200">
          <span className="text-base">🇺🇸</span>
          <span className="hidden sm:inline text-xs">EN</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    
    // Update document direction for RTL languages
    document.documentElement.dir = languageCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 transition-all duration-200 transform hover:scale-105"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-xs font-semibold uppercase">{currentLanguage.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} z-20 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden`}>
            <div className="py-1.5">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 flex items-center gap-3 transition-all duration-150 ${
                    currentLanguage.code === language.code
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-l-4 border-blue-500'
                      : 'text-gray-700 border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-xl">{language.flag}</span>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-sm">{language.nativeName}</span>
                    <span className="text-xs text-gray-500">{language.name}</span>
                  </div>
                  {currentLanguage.code === language.code && (
                    <span className="ml-auto text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
