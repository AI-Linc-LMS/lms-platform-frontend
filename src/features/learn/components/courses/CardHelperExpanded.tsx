import { VideoIcon } from "lucide-react";
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

// Stats block component
const StatBlock = ({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
}) => {
  const displayCount = typeof count === "object" ? 0 : Number(count) || 0;

  return (
    <div className="bg-[var(--neutral-50)] hover:bg-[var(--neutral-100)] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center relative group transition-all duration-200 overflow-visible touch-manipulation">
      {icon}
      {/* Enhanced tooltip with count and label */}
      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--neutral-500)] text-[var(--font-light)] text-xs rounded-lg pointer-events-none transition-opacity duration-200 z-[99999] whitespace-nowrap shadow-lg">
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-gray-300 mt-1">Count: {displayCount}</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[var(--neutral-500)]"></div>
      </div>
    </div>
  );
};

export default function CardHelperExpanded({
  course,
  isExpanded,
  toggleExpanded,
  showSuccessToast,
  courseLevel,
  courseDuration,
  coursePrice,
  courseRating,
  totalCounts,
  isEnrolling,
  handlePrimaryClick,
  handleIconAction,
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
        className="course-card"
        data-card-id={`regular-${course.id}`}
        key={`regular-${course.id}`}
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid #e3f2fd",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          maxWidth: "500px",
          width: "100%",
          // FIXED: Only show overflow hidden when NOT expanded
          overflow: isExpanded ? "visible" : "auto",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          position: "relative",
          zIndex: isExpanded ? 10 : 1,
        }}
      >
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-[var(--font-light)] rounded-xl shadow-lg">
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
              className={`expand-btn ${isExpanded ? "expanded" : ""}`}
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
                color: "var(--font-secondary)",
              }}
            >
              <svg
                style={{
                  fontSize: "14px",
                  transition: "transform 0.3s ease",
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
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

        {/* CRITICAL FIX: Expanded Content - Only renders for THIS specific card */}
        {isExpanded && (
          <div
            className="expanded-content"
            data-card-id={`regular-${course.id}`}
            key={`regular-${course.id}`}
            style={{
              // FIXED: Use height instead of maxHeight for better control
              height: "auto",
              opacity: "1",
              padding: "0px 24px 20px 24px",
              borderTop: "1px solid #f3f4f6",
              background: "white", // Ensure background matches card
              // FIXED: Prevent any layout shifts
              transform: "translateZ(0)", // Force hardware acceleration
              backfaceVisibility: "hidden", // Prevent flickering
            }}
          >
            {/* Course Outcomes */}
            <div
              style={{
                marginBottom: "16px",
                marginTop: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <ul
                style={{
                  listStyle: "none",
                  padding: "0",
                  margin: "0",
                  flex: "1",
                }}
              >
                {[
                  "Learn to build dashboards recruiters love to see in resumes",
                  "Master the most in-demand BI tool in just 20 hours",
                  "Used by 90% of Fortune 500 companies",
                  "Boost your analytics career with real-world Tableau skills",
                ].map((outcome, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.4",
                      color: "var(--font-secondary)",
                      marginBottom: "8px",
                      paddingLeft: "16px",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: "0",
                        color: "#10b981",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      ✓
                    </span>
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>

            {/* Info Chips */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              {[
                { text: courseLevel, icon: "⏱️" },
                { text: courseDuration, icon: null },
                { text: "Industry Certified", icon: null },
                { text: `$${coursePrice}`, icon: null, cost: true },
              ].map((chip, index) => (
                <div
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    background: chip.cost ? "#fef3c7" : "white",
                    border: `1px solid ${chip.cost ? "#fde68a" : "#e5e7eb"}`,
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: chip.cost ? "#92400e" : "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {chip.icon && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--font-secondary)",
                      }}
                    >
                      {chip.icon}
                    </span>
                  )}
                  {chip.text}
                </div>
              ))}
            </div>

            {/* Feature Badges */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              {[
                "Career Boost",
                "Hands-On Projects",
                "Industry Certificate",
              ].map((badge, index) => (
                <div
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  {badge}
                </div>
              ))}
            </div>

            {/* Rating Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div className="stars">
                <StarRating rating={courseRating} size="text-sm" />
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                {courseRating}/5 rating from 500+ learners
              </span>
            </div>

            {/* Enrollment Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {["DE", "TC", "AC"].map((initials, index) => (
                  <div
                    key={index}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "2px solid white",
                      marginLeft: index === 0 ? "0" : "-8px",
                      overflow: "hidden",
                      position: "relative",
                      zIndex: index + 1,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "white",
                        background:
                          index === 0
                            ? "#3b82f6"
                            : index === 1
                            ? "#06b6d4"
                            : "#8b5cf6",
                      }}
                    >
                      {initials}
                    </div>
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--font-secondary)",
                  fontWeight: "500",
                  lineHeight: "1.4",
                }}
              >
                Join 500+ learners who landed jobs at
                <br />
                Deloitte, TCS & Accenture with skills
              </p>
            </div>

            {/* What's Included */}
            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#0369a1",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🎁 What's Included:
              </h4>
              <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
                {[
                  "Real datasets & project templates",
                  "Free resume template for Data Analyst roles",
                ].map((item, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "12px",
                      color: "#0369a1",
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#0284c7" }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "16px",
                paddingTop: "8px",
              }}
            >
              {/* Action buttons with SVG icons */}
              <button
                onClick={() => handleIconAction("syllabus")}
                className="group"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "var(--font-secondary)",
                  position: "relative",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--font-secondary)" }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </button>

              <button
                onClick={() => handleIconAction("preview")}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "var(--font-secondary)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </button>

              <button
                onClick={() => handleIconAction("mentor")}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "var(--font-secondary)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M16 11l-4 4-2-2" />
                </svg>
              </button>

              <button
                onClick={() => handleIconAction("certificate")}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "var(--font-secondary)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                  <path d="M12 8l-2 2 2 2" />
                  <path d="M16 12l2-2-2-2" />
                </svg>
              </button>

              <StatBlock
                icon={<VideoIcon />}
                count={totalCounts.videos}
                label="Videos"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
