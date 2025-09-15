const SkeletonLoader = () => {
  return (
    <div className="min-h-[90vh] p-4 md:p-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="md:flex md:gap-8">
          {/* Left Column (Text content) */}
          <div className="md:w-1/2 space-y-6">
            {/* Title */}
            <div className="shimmer h-8 w-3/4 bg-gray-200 rounded-md"></div>
            {/* Paragraphs */}
            <div className="space-y-3">
              <div className="shimmer h-4 w-full bg-gray-200 rounded-md"></div>
              <div className="shimmer h-4 w-full bg-gray-200 rounded-md"></div>
              <div className="shimmer h-4 w-5/6 bg-gray-200 rounded-md"></div>
            </div>
            <div className="space-y-3">
              <div className="shimmer h-4 w-full bg-gray-200 rounded-md"></div>
              <div className="shimmer h-4 w-full bg-gray-200 rounded-md"></div>
              <div className="shimmer h-4 w-5/6 bg-gray-200 rounded-md"></div>
            </div>
          </div>

          {/* Right Column (Table content) */}
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="border border-gray-200 rounded-xl p-4">
              {/* Table Header */}
              <div className="flex justify-between mb-4">
                <div className="shimmer h-6 w-1/4 bg-gray-200 rounded-md"></div>
                <div className="shimmer h-6 w-1/4 bg-gray-200 rounded-md"></div>
                <div className="shimmer h-6 w-1/4 bg-gray-200 rounded-md"></div>
              </div>
              {/* Table Rows */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <div className="shimmer h-8 w-1/3 bg-gray-200 rounded-md"></div>
                    <div className="shimmer h-8 w-1/3 bg-gray-200 rounded-md"></div>
                    <div className="shimmer h-8 w-1/3 bg-gray-200 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
