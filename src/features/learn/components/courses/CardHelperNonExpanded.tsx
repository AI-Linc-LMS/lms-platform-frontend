import Course from "../../types/final-course.types";
import { CompanyLogosSection } from "./course-card-v2/components";

// Enhanced 3D Star Rating Component
const StarRating = ({
  rating,
  maxStars = 5,
  size = "text-sm",
}: {
  rating: number | undefined;
  maxStars?: number;
  size?: string;
}) => {
  const stars = [];
  const fullStars = (rating && Math.floor(rating)) ?? 0;
  const hasHalfStar = (rating && rating % 1 >= 0.5) ?? 0;

  for (let i = 1; i <= maxStars; i++) {
    if (i <= fullStars) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none`}
          style={{
            color: "#fbbf24",
            textShadow:
              "0 2px 4px rgba(0,0,0,0.3), 0 1px 8px rgba(251,191,36,0.4), 0 0 12px rgba(251,191,36,0.2)",
            filter:
              "drop-shadow(0 2px 3px rgba(0,0,0,0.2)) drop-shadow(0 0 6px rgba(251,191,36,0.3))",
            transform: "perspective(10px) rotateX(5deg)",
            display: "inline-block",
            transition: "all 0.2s ease",
          }}
        >
          ⭐
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none`}
          style={{
            color: "#fbbf24",
            textShadow:
              "0 1px 3px rgba(0,0,0,0.2), 0 0 6px rgba(251,191,36,0.3)",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
            opacity: 0.7,
            transform: "perspective(10px) rotateX(5deg)",
            display: "inline-block",
            transition: "all 0.2s ease",
          }}
        >
          ⭐
        </span>
      );
    } else {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none`}
          style={{
            color: "#d1d5db",
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))",
            transform: "perspective(10px) rotateX(5deg)",
            display: "inline-block",
            transition: "all 0.2s ease",
          }}
        >
          ☆
        </span>
      );
    }
  }

  return (
    <div className="flex items-center gap-1" style={{ lineHeight: 1 }}>
      {stars}
    </div>
  );
};

export default function CardHelper({
  course,
  isExpanded,
  toggleExpanded,
  showSuccessToast,
  courseLevel,
  courseDuration,
  coursePrice,
  courseRating,
  isEnrolling,
  handlePrimaryClick,
}: {
  course: Course;
  isExpanded: boolean;
  toggleExpanded: () => void;
  showSuccessToast: boolean;
  courseLevel: string | undefined;
  courseDuration: number | undefined;
  coursePrice: string | undefined;
  courseRating: number | undefined;
  totalCounts: { videos: number; articles: number; quizzes: number };
  isEnrolling: boolean;
  handlePrimaryClick: () => void;
  handleIconAction: (action: string) => void;
}) {
  return (
    <>
      <div
        className="course-card-1"
        data-card-id={`regular-${course.id}`}
        key={`regular-${course.id}`}
        style={{
          maxWidth: "500px",
        }}
      >
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">
                Successfully enrolled!
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e3f2fd",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Card Header */}
          <div
            className="card-header"
            style={{
              padding: "20px 24px 12px 24px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              className="header-main"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h1
                className="course-title"
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#374151",
                  margin: "0",
                  lineHeight: "1.2",
                }}
              >
                {course.title}
              </h1>

              <button
                className={`expand-btn`}
                onClick={toggleExpanded}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "#6b7280",
                }}
              >
                <svg
                  style={{
                    fontSize: "14px",
                    transition: "transform 0.3s ease",
                    transform: "rotate(0deg)",
                  }}
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div
              className="course-by"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <div
                className="company-logos"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <CompanyLogosSection />
              </div>
            </div>
          </div>

          {/* Minified Content - ALWAYS VISIBLE */}
          <div
            className="minified-content"
            style={{
              padding: "16px 24px 20px 24px",
            }}
          >
            <div
              className="quick-info"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                className="quick-chips"
                style={{
                  display: "flex",
                  gap: "6px",
                }}
              >
                <div
                  className="chip"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {courseLevel}
                </div>
                <div
                  className="chip"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {courseDuration}
                </div>
                <div
                  className="chip cost"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#92400e",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${coursePrice}
                </div>
              </div>

              <div
                className="quick-rating"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div className="stars" style={{ fontSize: "12px" }}>
                  <StarRating rating={courseRating} size="text-xs" />
                </div>
                <span
                  className="rating-text"
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  {courseRating}/5
                </span>
              </div>
            </div>

            <div className="quick-actions" style={{ width: "100%" }}>
              <button
                onClick={handlePrimaryClick}
                disabled={isEnrolling}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  marginBottom: "12px",
                  background: "#10b981",
                  color: "white",
                }}
              >
                {isEnrolling
                  ? "Processing…"
                  : !isExpanded
                  ? "View More"
                  : `Enroll Now - $${coursePrice}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
