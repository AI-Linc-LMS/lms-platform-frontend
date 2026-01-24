"use client";

interface HeaderSectionProps {
  meta: {
    assessment_name: string;
    completed_at: string;
    time_taken_minutes: number;
    recommended_retake_after_months: number;
    version: string;
  };
}

export function HeaderSection({ meta }: HeaderSectionProps) {
  const completedDate = new Date(meta.completed_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/psychometric-test.png)',
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-indigo-900/80"></div>
      </div>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 sm:-mr-32 sm:-mt-32"></div>
      <div className="absolute bottom-0 left-0 w-36 h-36 sm:w-48 sm:h-48 bg-white/5 rounded-full blur-2xl -ml-18 -mb-18 sm:-ml-24 sm:-mb-24"></div>
      
      <div className="relative z-10 p-4 sm:p-6 md:p-8 text-white">
        <div className="mb-4 sm:mb-6">
          {/* Badge */}
          <div className="exclude-from-pdf inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium border border-white/30 w-fit">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="whitespace-nowrap">Assessment Complete</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight break-words">
          {meta.assessment_name}
        </h1>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-100 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{completedDate}</span>
          </div>
          <div className="w-1 h-1 bg-white/40 rounded-full hidden sm:block flex-shrink-0"></div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-100 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{meta.time_taken_minutes} min</span>
          </div>
          <div className="w-1 h-1 bg-white/40 rounded-full hidden sm:block flex-shrink-0"></div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-100 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">v{meta.version}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border border-white/30 active:bg-white/30 hover:bg-white/30 transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline whitespace-nowrap">Retake recommended after {meta.recommended_retake_after_months} months</span>
          <span className="sm:hidden whitespace-nowrap">Retake in {meta.recommended_retake_after_months} months</span>
        </div>
      </div>
    </div>
  );
}
