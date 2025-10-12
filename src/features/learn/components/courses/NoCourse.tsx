import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NoCourseBgMobile from "../../../../assets/dashboard_assets/no-course-mlite.webp";
import NoCourseBgWeb from "../../../../assets/dashboard_assets/no-course.webp";

const NoCourse = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <>
      {/* Mobile View */}
      <div
        className="flex flex-col items-center justify-between text-center min-h-[calc(100vh-100px)] bg-cover bg-center px-4 py-8 md:hidden"
        style={{ backgroundImage: `url(${NoCourseBgMobile})` }}
      >
        <div className="max-w-lg w-full py-2">
          <h1 className="text-4xl font-bold text-[var(--font-light)] mb-3">
            {t("dashboard.emptyState.title")}
          </h1>
          <p className="text-gray-200 text-lg mb-8">
            {t("dashboard.emptyState.description")}
          </p>
        </div>
        <button
          className="w-full flex items-center justify-center sm:w-auto bg-white text-[var(--primary-500)] font-bold py-4 px-12 rounded-xl shadow-lg transform transition-transform cursor-pointer mb-4"
          onClick={() => navigate("/courses")}
        >
          {t("dashboard.emptyState.button")} {" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Web View */}
      <div className="hidden md:flex items-center justify-center min-h-[calc(100vh-100px)] px-16 bg-gray-50">
        <div className="flex items-center gap-24 w-full max-w-7xl mx-auto">
          {/* Left side */}
          <div className="w-5/12 text-left">
            <h1 className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
              {t("dashboard.emptyState.title")}
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              {t("dashboard.emptyState.description")}
            </p>
            <button
              className="group flex items-center justify-center w-auto bg-[var(--primary-500)] text-[var(--font-light)] font-bold py-4 px-12 rounded-xl shadow-lg transform transition-transform cursor-pointer hover:scale-105"
              onClick={() => navigate("/courses")}
            >
              {t("dashboard.emptyState.button")} {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 ml-3 transition-transform transform group-hover:translate-x-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {/* Right side with animation */}
          <div className="w-7/12 h-full flex items-center justify-center transform transition-transform duration-500 ease-in-out hover:scale-105">
            <img
              alt="Start Courses"
              className="rounded-2xl shadow-2xl"
              src={NoCourseBgWeb}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NoCourse;
