interface BackArrowIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const BackArrowIcon: React.FC<BackArrowIconProps> = ({ 
  width = 20, 
  height = 20, 
  className = "" 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M19 12H5" 
        stroke="#2A8CB0" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 19L5 12L12 5" 
        stroke="#2A8CB0" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BackArrowIcon; 