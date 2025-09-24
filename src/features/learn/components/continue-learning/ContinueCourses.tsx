import { useNavigate } from "react-router-dom";

const ContinueCourses = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-row items-center justify-between w-full pt-6 md:pt-12">
      <div>
        <h1 className="text-[var(--neutral-500)] font-bold text-[18px] md:text-[22px] ">
          Continue Learning
        </h1>
        <p className="text-[var(--neutral-300)]  font-normal text-[14px] md:text-[18px]">
          Continue where you left from.
        </p>
      </div>
      <div>
        <button
          onClick={() => navigate("/continue-learning")}
          className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[var(--primary-400)] text-[13px] md:text-[15px] font-medium  text-[var(--primary-400)] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95"
        >
          See all
        </button>
      </div>
    </div>
  );
};

export default ContinueCourses;
