import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

const WelcomeSection = () => {
  const user = useSelector((state: RootState) => state.user);

  return (
    <div className="mx-0">
        <div>
            <h1 className="text-xl font-bold">Hi, {user.full_name} 👋</h1>
            <p className="text-gray-500 text-sm">Keep learning today!</p>
        </div>
    </div>
  );
};

export default WelcomeSection;
