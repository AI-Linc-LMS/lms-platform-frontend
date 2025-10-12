import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "../../../redux/store";

const WelcomeSection = () => {
  const user = useSelector((state: RootState) => state.user);
  const { t } = useTranslation();

  return (
    <div className="mx-0">
        <div>
            <h1 className="text-xl font-bold">{t("dashboard.welcome.greeting", { name: user.full_name })}</h1>
            <p className="text-gray-500 text-sm">{t("dashboard.welcome.subtitle")}</p>
        </div>
    </div>
  );
};

export default WelcomeSection;
