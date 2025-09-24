interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "var(--primary-400)",
}) => {
  const sizeMap = {
    small: "w-6 h-6",
    medium: "w-10 h-10",
    large: "w-16 h-16",
  };

  const sizeClass = sizeMap[size];

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClass} border-4 border-t-transparent border-solid rounded-full animate-spin`}
        style={{ borderColor: `${color} transparent transparent transparent` }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
