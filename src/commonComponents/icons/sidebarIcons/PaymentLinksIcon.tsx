import React from 'react';

interface PaymentLinksIconProps {
  isActive?: boolean;
  className?: string;
}

const PaymentLinksIcon: React.FC<PaymentLinksIconProps> = ({ isActive = false, className = "" }) => {
  if (isActive) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4Z"
          fill="white"
        />
        <path
          d="M12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10Z"
          fill="#1f2937"
        />
        <path
          d="M18 12C18 13.66 16.66 15 15 15H9C7.34 15 6 13.66 6 12C6 10.34 7.34 9 9 9H15C16.66 9 18 10.34 18 12Z"
          fill="#1f2937"
        />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M6 12C6 10.34 7.34 9 9 9H15C16.66 9 18 10.34 18 12C18 13.66 16.66 15 15 15H9C7.34 15 6 13.66 6 12Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};

export default PaymentLinksIcon;
