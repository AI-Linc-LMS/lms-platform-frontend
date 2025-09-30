import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCourse } from "../../../../services/admin/courseApis";
import { useToast } from "../../../../contexts/ToastContext";

interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  slug?: string; // Optional slug property
  difficulty_level: string;
  language: string;
  price: string;
  is_free: boolean;
  published: boolean;
  enrolled_students: {
    total: number;
    students_profile_pic: string[];
  };
  stats: {
    video: { total: number };
    article: { total: number };
    quiz: { total: number };
    assignment: { total: number };
    coding_problem: { total: number };
  };
  trusted_by: string[];
  thumbnail: string | null;
  instructors?: Array<{
    id: number;
    name: string;
    profile_pic_url?: string;
  }>;
}

interface AdminCourseCardProps {
  course: Course;
  onEditClick: () => void;
  className?: string;
}

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
          className={`${size} inline-block leading-none select-none star-full`}
        >
          ⭐
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-half`}
        >
          ⭐
        </span>
      );
    } else {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-empty`}
        >
          ☆
        </span>
      );
    }
  }

  return <div className="flex items-center gap-0">{stars}</div>;
};

// Certified By Section Component (matching frontend)
const CertifiedBySection: React.FC<{ course: Course }> = ({ course }) => {
  const getCompanyLogo = (companyName: string) => {
    const name = companyName.toLowerCase();
    const companyLogoMap: Record<string, string> = {
      microsoft: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
      google: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
      amazon: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
      apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      netflix: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      tesla: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg",
      ibm: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
      oracle: "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
      salesforce: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
      cisco: "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
    };
    return companyLogoMap[name] || null;
  };

  // Generate trusted companies same as frontend
  const generateTrustedByCompanies = (course: Course) => {
    // If course already has trusted_by data, use it
    if (course.trusted_by && course.trusted_by.length > 0) {
      return course.trusted_by;
    }
    
    // Generate based on course type/title (same logic as frontend)
    const allCompanies = [
      "Microsoft", "Google", "Amazon", "Apple", "Meta", 
      "Netflix", "Tesla", "IBM", "Oracle", "Salesforce"
    ];
    
    // Select 2-4 companies based on course ID
    const numCompanies = Math.floor((course.id % 3) + 2); // 2-4 companies
    const startIndex = course.id % (allCompanies.length - numCompanies);
    
    return allCompanies.slice(startIndex, startIndex + numCompanies);
  };

  const trustedCompanies = generateTrustedByCompanies(course);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-[var(--font-tertiary)] font-normal uppercase tracking-[0.5px]">
        Created and certified by
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {trustedCompanies.slice(0, 3).map((company, index) => {
          const companyName = typeof company === "string" ? company : company;
          const logoUrl = getCompanyLogo(companyName);
          return (
            <div
              key={index}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-md text-[11px] font-semibold text-[#475569] hover:shadow-sm transition-shadow duration-200"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-[var(--font-secondary)] flex items-center justify-center text-[var(--font-light)] text-[8px] font-bold">
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{companyName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Content Metrics Section (matching frontend)
const ContentMetricsSection: React.FC<{ course: Course }> = ({ course }) => {
  const contentMetrics = [
    {
      id: "videos",
      icon: (
        <svg className="w-5 h-5 text-[var(--font-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: "Videos",
      value: course.stats?.video?.total || 0,
    },
    {
      id: "articles",
      icon: (
        <svg className="w-5 h-5 text-[var(--font-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Articles",
      value: course.stats?.article?.total || 0,
    },
    {
      id: "quizzes",
      icon: (
        <svg className="w-5 h-5 text-[var(--font-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Quizzes",
      value: course.stats?.quiz?.total || 0,
    },
    {
      id: "problems",
      icon: (
        <svg className="w-5 h-5 text-[var(--font-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: "Problems",
      value: course.stats?.coding_problem?.total || 0,
    },
    {
      id: "assignments",
      icon: (
        <svg className="w-5 h-5 text-[var(--font-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: "Subjective",
      value: course.stats?.assignment?.total || 0,
    },
  ];

  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-[var(--font-secondary)] mb-2 uppercase tracking-[0.5px]">
        Content
      </div>
      <div className="grid grid-cols-5 gap-2">
        {contentMetrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer hover:border-[#10b981] hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(16,185,129,0.1)] relative group"
          >
            {metric.icon}
            <span className="text-xs font-medium text-[var(--font-tertiary)] leading-none">
              {metric.value}
            </span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#374151] text-[var(--font-light)] px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 invisible transition-all duration-200 z-[1000] mb-2 group-hover:opacity-100 group-hover:visible">
              {metric.value} {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Instructor Section Component
const InstructorSection: React.FC<{ instructors?: Array<{ id: number; name: string; profile_pic_url?: string }> }> = ({ instructors }) => {
  if (!instructors || instructors.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-[var(--font-secondary)] mb-2 uppercase tracking-[0.5px]">
        Instructors
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {instructors.slice(0, 3).map((instructor, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white overflow-hidden flex-shrink-0"
              title={instructor.name}
            >
              <img
                src={
                  instructor.profile_pic_url ||
                  `https://images.unsplash.com/photo-${
                    index === 0
                      ? "1472099645785-5658abf4ff4e"
                      : index === 1
                      ? "1507003211169-0a1dd7228f2d"
                      : "1494790108755-2616b612b786"
                  }?w=40&h=40&fit=crop&crop=face`
                }
                alt={instructor.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <span className="text-xs text-[var(--font-secondary)] truncate">
          {instructors[0]?.name || "Expert Instructor"}
          {instructors.length > 1 && ` +${instructors.length - 1} more`}
        </span>
      </div>
    </div>
  );
};

const AdminCourseCard: React.FC<AdminCourseCardProps> = ({
  course,
  onEditClick,
  className = "",
}) => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  // State for inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(course.title);
  const [tempDescription, setTempDescription] = useState(course.description);

  // Refs for input elements
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to generate a safe slug
  const generateSlug = (title: string, originalSlug?: string): string => {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters but keep spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // If the title hasn't really changed (just formatting/spacing), keep original slug
    const normalizedOriginal = course.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedNew = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (originalSlug && normalizedOriginal === normalizedNew) {
      console.log('Title change is just formatting, keeping original slug:', originalSlug);
      return originalSlug;
    }
    
    // Ensure slug is not empty and is unique
    let finalSlug = baseSlug || 'course';
    
    // Add timestamp if slug might conflict (when title changes significantly)
    if (finalSlug !== originalSlug && baseSlug.length > 0) {
      // Use a shorter timestamp to avoid overly long slugs
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      finalSlug = `${baseSlug}-${timestamp}`;
    }
    
    console.log('Generated slug:', { title, originalSlug, finalSlug });
    return finalSlug;
  };

  // Mutation for updating course
  const updateCourseMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string }) => {
      const currentSlug = course.slug || course.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const updateData = {
        title: data.title || course.title,
        description: data.description || course.description,
        slug: data.title ? generateSlug(data.title, currentSlug) : currentSlug,
        ...data,
      };
      
      console.log('Updating course with data:', updateData);
      return updateCourse(clientId, course.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      success("Course Updated", "Course has been successfully updated.");
    },
    onError: (error: Error) => {
      console.error('Course update failed:', error);
      showError("Update Failed", error.message);
      // Reset temp values on error
      setTempTitle(course.title);
      setTempDescription(course.description);
    },
  });

  // Handle title editing
  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const handleTitleSave = () => {
    const trimmedTitle = tempTitle.trim();
    
    // Validation checks
    if (!trimmedTitle) {
      showError("Validation Error", "Course title cannot be empty.");
      setTempTitle(course.title); // Reset to original
      setIsEditingTitle(false);
      return;
    }
    
    if (trimmedTitle.length < 3) {
      showError("Validation Error", "Course title must be at least 3 characters long.");
      setTempTitle(course.title); // Reset to original
      setIsEditingTitle(false);
      return;
    }
    
    if (trimmedTitle !== course.title) {
      console.log('Saving title change:', { from: course.title, to: trimmedTitle });
      updateCourseMutation.mutate({ title: trimmedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(course.title);
    setIsEditingTitle(false);
  };

  // Handle description editing
  const handleDescriptionEdit = () => {
    setIsEditingDescription(true);
    setTimeout(() => {
      descriptionTextareaRef.current?.focus();
    }, 0);
  };

  const handleDescriptionSave = () => {
    const trimmedDescription = tempDescription.trim();
    
    // Allow empty description, but if provided, it should be meaningful
    if (trimmedDescription && trimmedDescription.length < 10) {
      showError("Validation Error", "Course description should be at least 10 characters if provided.");
      setTempDescription(course.description); // Reset to original
      setIsEditingDescription(false);
      return;
    }
    
    if (trimmedDescription !== course.description) {
      console.log('Saving description change:', { from: course.description, to: trimmedDescription });
      updateCourseMutation.mutate({ description: trimmedDescription });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(course.description);
    setIsEditingDescription(false);
  };

  // Handle keyboard events
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleDescriptionSave();
    } else if (e.key === "Escape") {
      handleDescriptionCancel();
    }
  };

  // Update temp values when course data changes
  useEffect(() => {
    setTempTitle(course.title);
    setTempDescription(course.description);
  }, [course.title, course.description]);

  const formattedPrice = course.is_free ? "Free" : `₹${course.price}`;
  const courseRating = 4.8; // Default rating
  const courseLevel = course.difficulty_level;
  const courseDuration = `${course.stats.video.total + course.stats.article.total + course.stats.quiz.total + course.stats.assignment.total + course.stats.coding_problem.total} lessons`;

  return (
    <div
      className={`course-card w-full max-w-lg bg-white rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out relative overflow-hidden ${className}`}
    >
      {/* Published Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`${
            course.published
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          } text-xs px-3 py-1 rounded-full border font-medium`}
        >
          {course.published ? "Published" : "Draft"}
        </span>
      </div>

      {/* Card Header */}
      <div className="p-4 sm:p-6 pb-3 border-b border-gray-100 pt-12">
        <div className="flex items-start justify-between mb-2">
          {/* Editable Title */}
          <div className="flex-1 pr-4">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight w-full bg-transparent border-b-2 border-blue-500 focus:outline-none"
                maxLength={100}
              />
            ) : (
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight cursor-pointer hover:text-blue-600 transition-colors group"
                onClick={handleTitleEdit}
                title="Click to edit title"
              >
                {course.title}
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  ✏️
                </span>
              </h1>
            )}
          </div>
        </div>

        {/* Created and Certified By */}
        <CertifiedBySection course={course} />
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 md:p-6">
        {/* Course Info Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap">
            <svg
              className="w-3 h-3 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {courseLevel}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap">
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {courseDuration}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-800 whitespace-nowrap">
            {formattedPrice}
          </span>
          {/* Rating */}
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={courseRating} size="text-xs" />
            <span className="text-xs font-semibold text-gray-700">
              {courseRating}/5
            </span>
          </div>
        </div>

        {/* Editable Description */}
        <div className="mb-4">
          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                ref={descriptionTextareaRef}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                className="w-full p-2 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter course description..."
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleDescriptionSave}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDescriptionCancel}
                    className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  Ctrl+Enter to save
                </span>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group"
              onClick={handleDescriptionEdit}
              title="Click to edit description"
            >
              {course.description || "No description available"}
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                ✏️
              </span>
            </p>
          )}
        </div>

        {/* Content Metrics */}
        <ContentMetricsSection course={course} />

        {/* Instructor Section */}
        <InstructorSection instructors={course.instructors} />

        {/* Students Count */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-[var(--font-secondary)] mb-2 uppercase tracking-[0.5px]">
            Enrolled Students
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {course.enrolled_students.students_profile_pic
                ?.slice(0, 4)
                .map((pic, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
                  >
                    <img
                      src={pic}
                      alt={`Student ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.style.backgroundColor = "#D1D5DB";
                      }}
                    />
                  </div>
                )) || []}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {course.enrolled_students.total} students
            </span>
          </div>
        </div>
      </div>

      {/* Action Button - Continue Learning Style - Moved to bottom */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onEditClick}
          className="px-5 py-3 border border-[#10b981] rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 text-center bg-transparent text-[#10b981] hover:bg-[#10b981] hover:text-[var(--font-light)] hover:-translate-y-0.5 w-full flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Course Content
        </button>
      </div>
    </div>
  );
};

export default AdminCourseCard;