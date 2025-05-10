const ContinueCourses = () => {
  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div>
        <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
          Continue Learning
        </h1>
        <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[18px]">
          Continue where you left from.
        </p>
      </div>
      <div>
        <button className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[#2A8CB0] text-[13px] md:text-[15px] font-medium font-sans text-[#2A8CB0] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95">
          See all
        </button>
      </div>
    </div>
  );
};

export default ContinueCourses;