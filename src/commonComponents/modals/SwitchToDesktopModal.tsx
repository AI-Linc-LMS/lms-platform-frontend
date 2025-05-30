import React from 'react';
import mobileIcon from '../../assets/mobile-icon.svg';
import desktopIcon from '../../assets/desktop-icon.svg';

interface SwitchToDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SwitchToDesktopModal: React.FC<SwitchToDesktopModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={mobileIcon} alt="Mobile" className="w-8 h-8" />
            </div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-[#80C9E0]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.59 12l-2.3-2.3a1 1 0 0 1 1.42-1.4l3 3a1 1 0 0 1 0 1.4l-3 3a1 1 0 0 1-1.42-1.4l2.3-2.3z"/>
                </svg>
              ))}
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={desktopIcon} alt="Desktop" className="w-10 h-10" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-3">Switch to Desktop</h2>
        <p className="text-center text-gray-600">
          For the best experience, please use a laptop or desktop to access the dashboard.
        </p>
      </div>
    </div>
  );
};

export default SwitchToDesktopModal; 