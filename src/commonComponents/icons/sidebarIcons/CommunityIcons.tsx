import React from "react";

interface CommunityIconProps {
  isActive?: boolean;
  className?: string;
}

const CommunityIcon: React.FC<CommunityIconProps> = ({
  isActive = true,
  className,
}) => {
  // Debug logging to check if isActive is being passed correctly
  console.log("CommunityIcon isActive:", isActive);

  const strokeColor = isActive ? "currentColor" : "currentColor";

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11 8.5C11 9.82608 11.5268 11.0979 12.4645 12.0355C13.4021 12.9732 14.6739 13.5 16 13.5C17.3261 13.5 18.5979 12.9732 19.5355 12.0355C20.4732 11.0979 21 9.82608 21 8.5C21 7.17392 20.4732 5.90215 19.5355 4.96447C18.5979 4.02678 17.3261 3.5 16 3.5C14.6739 3.5 13.4021 4.02678 12.4645 4.96447C11.5268 5.90215 11 7.17392 11 8.5Z"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <path
        d="M23.5 12.25C25.5711 12.25 27.25 10.8509 27.25 9.125C27.25 7.39911 25.5711 6 23.5 6"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 12.25C6.42894 12.25 4.75 10.8509 4.75 9.125C4.75 7.39911 6.42894 6 8.5 6"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 22.25C8.5 23.5761 9.29018 24.8479 10.6967 25.7855C12.1032 26.7232 14.0109 27.25 16 27.25C17.9891 27.25 19.8968 26.7232 21.3033 25.7855C22.7098 24.8479 23.5 23.5761 23.5 22.25C23.5 20.9239 22.7098 19.6521 21.3033 18.7145C19.8968 17.7768 17.9891 17.25 16 17.25C14.0109 17.25 12.1032 17.7768 10.6967 18.7145C9.29018 19.6521 8.5 20.9239 8.5 22.25Z"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <path
        d="M26 24.75C28.1927 24.2691 29.75 23.0514 29.75 21.625C29.75 20.1986 28.1927 18.9809 26 18.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 24.75C3.80719 24.2691 2.25 23.0514 2.25 21.625C2.25 20.1986 3.80719 18.9809 6 18.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CommunityIcon;
