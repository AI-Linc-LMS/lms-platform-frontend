import React from "react";

interface EmailIconProps {
  isActive: boolean;
}

const EmailIcon: React.FC<EmailIconProps> = ({ isActive }) => {
  if (isActive) {
    return (
      <svg
        width="42"
        height="42"
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Envelope body */}
        <rect
          x="6"
          y="11"
          width="30"
          height="20"
          rx="3"
          fill="white"
          stroke="#12293A"
          strokeWidth="2"
        />
        {/* Envelope flap */}
        <polygon points="6,11 21,24 36,11" fill="#12293A" />
        {/* Envelope shadow */}
        <polygon points="6,31 21,18 36,31" fill="#E5EAF1" />
      </svg>
    );
  }

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Envelope body */}
      <rect
        x="4"
        y="7"
        width="20"
        height="14"
        rx="2"
        fill="white"
        stroke="#12293A"
        strokeWidth="1.5"
      />
      {/* Envelope flap */}
      <polygon points="4,7 14,17 24,7" fill="#12293A" />
      {/* Envelope shadow */}
      <polygon points="4,21 14,10 24,21" fill="#E5EAF1" />
    </svg>
  );
};

export default EmailIcon;
