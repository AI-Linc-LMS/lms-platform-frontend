import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useState, useEffect } from "react";

const WelcomeSection = () => {
  const user = useSelector((state: RootState) => state.user);
  const [greeting, setGreeting] = useState("");

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoonssss";
    } else {
      return "Good evening";
    } 
  };

  useEffect(() => {
    // Set initial greeting
    setGreeting(getTimeBasedGreeting());
    
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-0">
      <h1 className="text-2xl text-black font-sans font-bold md:text-[22px]">
        {greeting},{" "}
        <span className="inline-block group perspective-[1000px]">
          <span className="relative inline-block transition-transform duration-500 transform group-hover:rotate-y-180 text-[#2A8CB0]">
            {user.full_name}.
          </span>
        </span>
      </h1>
      <p className="text-[#495057] md:text-[18px] font-normal font-sans">
        Here is a glimpse of your overall progress.
      </p>
    </div>
  );
};

export default WelcomeSection;
