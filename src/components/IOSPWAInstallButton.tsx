import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useIOSPWAInstall } from '../hooks/useIOSPWAInstall';

interface IOSPWAInstallButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
  children?: React.ReactNode;
}

export const IOSPWAInstallButton: React.FC<IOSPWAInstallButtonProps> = ({
  variant = 'primary',
  className = '',
  children
}) => {
  const { isIOS, isInstalled, showPrompt } = useIOSPWAInstall();

  // Don't show button if not iOS or already installed
  if (!isIOS || isInstalled) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center space-x-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shadow-md hover:shadow-lg focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 border border-gray-300 focus:ring-gray-500',
    minimal: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 focus:ring-blue-500'
  };

  const iconSize = variant === 'minimal' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={showPrompt}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title="Install App"
    >
      {variant === 'minimal' ? (
        <Smartphone className={iconSize} />
      ) : (
        <>
          <Download className={iconSize} />
          <span>{children || 'Install App'}</span>
        </>
      )}
    </button>
  );
};

export default IOSPWAInstallButton;
