const EmptyCoursesState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-[var(--primary-200)] shadow-sm transition-all duration-300 transform hover:scale-[1.01]">
      <svg
        className="w-20 h-20 text-[var(--primary-400)] mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <h3 className="text-xl font-bold text-[var(--neutral-500)] mb-2">
        No courses available
      </h3>
      <p className="text-[var(--neutral-300)] text-center max-w-md mb-8 text-[14px] md:text-[16px]">
        There are no courses available at the moment. Please check back later or
        contact our support team for assistance.
      </p>
    </div>
  );
};

export default EmptyCoursesState;
