import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

const WelcomeSection = () => {
  const user = useSelector((state: RootState) => state.user);
  
  return (
    <div className="mx-0">
      <h1 className="text-2xl text-black font-sans font-bold md:text-[22px]">Welcome {user.full_name},</h1>
      <p className="text-[#495057] md:text-[18px] font-normal font-sans">
        Here is a glimpse of your overall progress.
      </p>
    </div>
  );
};

export default WelcomeSection;
