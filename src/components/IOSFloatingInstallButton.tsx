import React from 'react';
import { Smartphone } from 'lucide-react';
import { useIOSPWAInstall } from '../hooks/useIOSPWAInstall';

export const IOSFloatingInstallButton: React.FC = () => {
  const { isIOS, showPrompt } = useIOSPWAInstall();

  if (!isIOS) return null;

  return (
    <button
      onClick={showPrompt}
      className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
      title="Install App"
      aria-label="Install App"
    >
      <Smartphone className="w-6 h-6" />
    </button>
  );
};

export default IOSFloatingInstallButton;
