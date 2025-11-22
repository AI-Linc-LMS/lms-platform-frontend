import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCourse } from "../../../../services/admin/courseApis";
import { useToast } from "../../../../contexts/ToastContext";
import {
  setStoredRating,
  getEffectiveRating,
  setStoredDifficulty,
  getEffectiveDifficulty,
  setStoredCompanies,
  getEffectiveCompanies,
  getAllAvailableCompanies,
  setStoredLearningObjectives,
  getEffectiveLearningObjectives,
  setStoredStudentStats,
  getEffectiveStudentStats,
  setStoredJobPlacement,
  getEffectiveJobPlacement,
  setStoredWhatsIncluded,
  getEffectiveWhatsIncluded,
  setStoredCourseTags,
  getEffectiveCourseTags,
  DEFAULT_AVAILABLE_TAGS,
  setStoredFeatures,
  getEffectiveFeatures,
  setStoredRequirements,
  getEffectiveRequirements,
  cleanUpHardcodedTags,
  setStoredInstructors,
  getEffectiveInstructors,
  setStoredDuration,
  getEffectiveDuration,
} from "../../../learn/components/courses/course-card-v2/utils/courseDataUtils";

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
  rating?: number; // Course rating 0-5
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
  // Additional frontend fields
  tags?: string[];
  learning_objectives?: string;
  requirements?: string;
  whats_included?: string[];
  features?: string[];
  certificate_available?: boolean;
  duration_in_hours?: number;
  liked_by?: unknown[];
  liked_count?: number;
  is_liked_by_current_user?: boolean;
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

// Note: Default generation functions removed - now using centralized courseDataUtils functions

// Content Metrics Section (matching frontend)
const ContentMetricsSection: React.FC<{ course: Course }> = ({ course }) => {
  const contentMetrics = [
    {
      id: "videos",
      icon: (
        <svg
          className="w-5 h-5 text-[var(--font-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      label: "Videos",
      value: course.stats?.video?.total || 0,
    },
    {
      id: "articles",
      icon: (
        <svg
          className="w-5 h-5 text-[var(--font-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      label: "Articles",
      value: course.stats?.article?.total || 0,
    },
    {
      id: "quizzes",
      icon: (
        <svg
          className="w-5 h-5 text-[var(--font-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "Quizzes",
      value: course.stats?.quiz?.total || 0,
    },
    {
      id: "problems",
      icon: (
        <svg
          className="w-5 h-5 text-[var(--font-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      label: "Problems",
      value: course.stats?.coding_problem?.total || 0,
    },
    {
      id: "assignments",
      icon: (
        <svg
          className="w-5 h-5 text-[var(--font-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
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
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [isEditingDifficulty, setIsEditingDifficulty] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isEditingCompanies, setIsEditingCompanies] = useState(false);
  const [isEditingLearningObjectives, setIsEditingLearningObjectives] =
    useState(false);
  const [isEditingStudentStats, setIsEditingStudentStats] = useState(false);
  const [isEditingJobPlacement, setIsEditingJobPlacement] = useState(false);
  const [isEditingWhatsIncluded, setIsEditingWhatsIncluded] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingFeatures, setIsEditingFeatures] = useState(false);
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [isEditingInstructors, setIsEditingInstructors] = useState(false);

  const [tempTitle, setTempTitle] = useState(course.title);
  const [tempDescription, setTempDescription] = useState(course.description);
  // Initialize temp rating with centralized rating logic
  const [tempRating, setTempRating] = useState(() =>
    getEffectiveRating(course)
  );
  const [tempDifficulty, setTempDifficulty] = useState(() =>
    getEffectiveDifficulty({
      id: course.id,
      difficulty_level: course.difficulty_level,
    })
  );
  const [tempDuration, setTempDuration] = useState(() =>
    getEffectiveDuration({
      id: course.id,
      duration_in_hours: course.duration_in_hours,
    })
  );
  const [tempCompanies, setTempCompanies] = useState(() =>
    getEffectiveCompanies({ id: course.id }).map((c) => c.name)
  );
  const [tempLearningObjectives, setTempLearningObjectives] = useState(() =>
    getEffectiveLearningObjectives({
      id: course.id,
      learning_objectives: course.learning_objectives,
    })
  );
  const [tempStudentStats, setTempStudentStats] = useState(() =>
    getEffectiveStudentStats({
      id: course.id,
      rating: course.rating,
      enrolled_students: course.enrolled_students,
    })
  );
  const [tempJobPlacement, setTempJobPlacement] = useState(() =>
    getEffectiveJobPlacement({
      id: course.id,
      enrolled_students: course.enrolled_students,
    })
  );
  const [tempWhatsIncluded, setTempWhatsIncluded] = useState(() =>
    getEffectiveWhatsIncluded({
      id: course.id,
      whats_included: course.whats_included,
      stats: course.stats,
    })
  );
  const [tempTags, setTempTags] = useState(() =>
    getEffectiveCourseTags({
      id: course.id,
      tags: course.tags,
      title: course.title,
      difficulty_level: course.difficulty_level,
    })
  );
  const [tempFeatures, setTempFeatures] = useState(() =>
    getEffectiveFeatures({
      id: course.id,
      features: course.features,
      stats: course.stats,
    })
  );
  const [tempRequirements, setTempRequirements] = useState(() =>
    getEffectiveRequirements({
      id: course.id,
      requirements: course.requirements,
      difficulty_level: course.difficulty_level,
    })
  );
  const [tempInstructors, setTempInstructors] = useState<
    Array<{
      id?: number | undefined;
      name?: string | undefined;
      bio?: string;
      profile_pic_url?: string;
      linkedin_profile?: string;
    }>
  >([]);

  // Default instructors pool
  const DEFAULT_INSTRUCTORS = [
    {
      id: 1,
      name: "Shubham Lal",
      profile_pic_url:
        "https://lh3.googleusercontent.com/a/ACg8ocJSPMwGcKIWqYE1LDeBo_N1Z5pYriaPsNJSwLFAbPQ4N9lmnNIs=s96-c",
    },
    {
      id: 2,
      name: "Dr. Sarah Johnson",
      profile_pic_url:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      name: "Michael Chen",
      profile_pic_url:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      profile_pic_url:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 5,
      name: "David Kumar",
      profile_pic_url:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 6,
      name: "Lisa Thompson",
      profile_pic_url:
        "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
    },
  ];

  // Additional what's included editing state
  const [newWhatsIncludedItem, setNewWhatsIncludedItem] = useState("");
  const [whatsIncludedError, setWhatsIncludedError] = useState("");

  // Additional features editing state
  const [newFeatureItem, setNewFeatureItem] = useState("");
  const [featuresError, setFeaturesError] = useState("");

  // Additional requirements editing state
  const [newRequirementItem, setNewRequirementItem] = useState("");
  const [requirementsError, setRequirementsError] = useState("");

  // Force refresh trigger for localStorage changes
  const [companiesRefreshKey, setCompaniesRefreshKey] = useState(0);
  const [learningObjectivesRefreshKey, setLearningObjectivesRefreshKey] =
    useState(0);
  const [studentStatsRefreshKey, setStudentStatsRefreshKey] = useState(0);
  const [jobPlacementRefreshKey, setJobPlacementRefreshKey] = useState(0);
  const [whatsIncludedRefreshKey, setWhatsIncludedRefreshKey] = useState(0);
  const [tagsRefreshKey, setTagsRefreshKey] = useState(0);
  const [featuresRefreshKey, setFeaturesRefreshKey] = useState(0);
  const [requirementsRefreshKey, setRequirementsRefreshKey] = useState(0);
  const [instructorsRefreshKey, setInstructorsRefreshKey] = useState(0);

  // Refs for input elements
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const ratingInputRef = useRef<HTMLInputElement>(null);
  const difficultySelectRef = useRef<HTMLSelectElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);
  const companiesSelectRef = useRef<HTMLSelectElement>(null);

  // Helper function to generate a safe slug
  const generateSlug = (title: string, originalSlug?: string): string => {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters but keep spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    // If the title hasn't really changed (just formatting/spacing), keep original slug
    const normalizedOriginal = course.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const normalizedNew = title.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (originalSlug && normalizedOriginal === normalizedNew) {
      return originalSlug;
    }

    // Ensure slug is not empty and is unique
    let finalSlug = baseSlug || "course";

    // Add timestamp if slug might conflict (when title changes significantly)
    if (finalSlug !== originalSlug && baseSlug.length > 0) {
      // Use a shorter timestamp to avoid overly long slugs
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      finalSlug = `${baseSlug}-${timestamp}`;
    }

    return finalSlug;
  };

  // Mutation for updating course
  const updateCourseMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      description?: string;
      rating?: number;
      difficulty_level?: string;
      duration_in_hours?: number;
    }) => {
      const currentSlug =
        course.slug ||
        course.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      const updateData = {
        title: data.title || course.title,
        description: data.description || course.description,
        slug: data.title ? generateSlug(data.title, currentSlug) : currentSlug,
        // Ensure rating and difficulty_level are included if provided
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.difficulty_level && {
          difficulty_level: data.difficulty_level,
        }),
        ...(data.duration_in_hours !== undefined && {
          duration_in_hours: data.duration_in_hours,
        }),
      };

      return updateCourse(clientId, course.id, updateData);
    },
    onSuccess: () => {
      // Invalidate admin dashboard courses
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.refetchQueries({ queryKey: ["courses"] });

      // Invalidate ALL frontend course queries to update course cards v2
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] }); // Enrolled courses
      queryClient.invalidateQueries({
        queryKey: ["course", course.id.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["basedLearningCourses", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["basedLearningCoursesAll", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["continueCourses", clientId],
      });
      queryClient.invalidateQueries({ queryKey: ["continueCourses"] });
      queryClient.invalidateQueries({ queryKey: ["enrolledCourses"] });

      // Refetch the main frontend courses queries
      queryClient.refetchQueries({ queryKey: ["all-courses"] });
      queryClient.refetchQueries({ queryKey: ["courses"] });

      success("Course Updated", "Course has been successfully updated.");
    },
    onError: (error: Error) => {
      // Course update failed
      showError("Update Failed", error.message);

      // Rollback optimistic updates by refetching
      queryClient.refetchQueries({ queryKey: ["courses"] });

      // Reset temp values on error
      setTempTitle(course.title);
      setTempDescription(course.description);
      setTempRating(courseRating);
      setTempDifficulty(courseDifficulty);
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
      showError(
        "Validation Error",
        "Course title must be at least 3 characters long."
      );
      setTempTitle(course.title); // Reset to original
      setIsEditingTitle(false);
      return;
    }

    if (trimmedTitle !== course.title) {
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
      showError(
        "Validation Error",
        "Course description should be at least 10 characters if provided."
      );
      setTempDescription(course.description); // Reset to original
      setIsEditingDescription(false);
      return;
    }

    if (trimmedDescription !== course.description) {
      updateCourseMutation.mutate({ description: trimmedDescription });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(course.description);
    setIsEditingDescription(false);
  };

  // Handle rating editing
  const handleRatingEdit = () => {
    setIsEditingRating(true);
    setTimeout(() => {
      ratingInputRef.current?.focus();
    }, 0);
  };

  const handleRatingSave = () => {
    const numericRating = isNaN(tempRating) ? 0 : tempRating;

    if (numericRating < 0 || numericRating > 5) {
      showError("Validation Error", "Rating must be between 0 and 5.");
      setTempRating(courseRating);
      setIsEditingRating(false);
      return;
    }

    if (Math.abs(numericRating - courseRating) > 0.01) {
      // Allow for small floating point differences

      // Store rating locally for immediate persistence
      setStoredRating(course.id, numericRating);

      // Optimistic update: immediately update the UI
      queryClient.setQueryData(["courses"], (oldData: Course[]) => {
        if (!oldData) return oldData;
        return oldData.map((c: Course) =>
          c.id === course.id ? { ...c, rating: numericRating } : c
        );
      });

      updateCourseMutation.mutate({ rating: numericRating });
    } else {
    }
    setIsEditingRating(false);
  };

  const handleRatingCancel = () => {
    setTempRating(courseRating);
    setIsEditingRating(false);
  };

  // Handle difficulty editing
  const handleDifficultyEdit = () => {
    setIsEditingDifficulty(true);
    setTimeout(() => {
      difficultySelectRef.current?.focus();
    }, 0);
  };

  const handleDifficultySave = () => {
    if (tempDifficulty !== courseDifficulty) {

      // Store difficulty locally for immediate persistence
      setStoredDifficulty(course.id, tempDifficulty);

      // Optimistic update: immediately update the UI
      queryClient.setQueryData(["courses"], (oldData: Course[]) => {
        if (!oldData) return oldData;
        return oldData.map((c: Course) =>
          c.id === course.id ? { ...c, difficulty_level: tempDifficulty } : c
        );
      });

      updateCourseMutation.mutate({ difficulty_level: tempDifficulty });
    } else {
    }
    setIsEditingDifficulty(false);
  };

  const handleDifficultyCancel = () => {
    setTempDifficulty(courseDifficulty);
    setIsEditingDifficulty(false);
  };

  // Handle duration editing
  const handleDurationEdit = () => {
    setIsEditingDuration(true);
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 0);
  };

  const handleDurationSave = () => {
    const numericDuration = Number(tempDuration);
    const currentDuration = getEffectiveDuration({
      id: course.id,
      duration_in_hours: course.duration_in_hours,
    });

    if (numericDuration !== currentDuration && numericDuration > 0) {

      // Store duration locally for immediate persistence
      setStoredDuration(course.id, numericDuration);

      // Optimistic update: immediately update the UI
      queryClient.setQueryData(["courses"], (oldData: Course[]) => {
        if (!oldData) return oldData;
        return oldData.map((c: Course) =>
          c.id === course.id ? { ...c, duration_in_hours: numericDuration } : c
        );
      });

      updateCourseMutation.mutate({ duration_in_hours: numericDuration });
    } else {
    }
    setIsEditingDuration(false);
  };

  const handleDurationCancel = () => {
    setTempDuration(
      getEffectiveDuration({
        id: course.id,
        duration_in_hours: course.duration_in_hours,
      })
    );
    setIsEditingDuration(false);
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

  const handleRatingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRatingSave();
    } else if (e.key === "Escape") {
      handleRatingCancel();
    }
  };

  const handleDifficultyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDifficultySave();
    } else if (e.key === "Escape") {
      handleDifficultyCancel();
    }
  };

  const handleDurationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDurationSave();
    } else if (e.key === "Escape") {
      handleDurationCancel();
    }
  };

  // Handle company editing
  const handleCompanyEdit = () => {
    setIsEditingCompanies(true);
    setTimeout(() => {
      companiesSelectRef.current?.focus();
    }, 0);
  };

  const handleCompanySave = () => {
    const currentCompanies = getEffectiveCompanies({ id: course.id }).map(
      (c) => c.name
    );
    if (
      JSON.stringify(tempCompanies.sort()) !==
      JSON.stringify(currentCompanies.sort())
    ) {

      // Store companies locally for immediate persistence
      setStoredCompanies(course.id, tempCompanies);

      // Force refresh of companies memo to reflect localStorage changes immediately
      setCompaniesRefreshKey((prev) => prev + 1);

      // Optimistic update: immediately update the UI (no backend field yet, only localStorage)
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });

      // No backend mutation for companies yet - only localStorage persistence
      success(
        "Companies Updated",
        "Company selection has been updated and will be reflected in the frontend."
      );
    } else {
    }
    setIsEditingCompanies(false);
  };

  const handleCompanyCancel = () => {
    setTempCompanies(courseCompanies.map((c) => c.name));
    setIsEditingCompanies(false);
  };

  const handleCompanyToggle = (companyName: string) => {
    if (tempCompanies.includes(companyName)) {
      setTempCompanies(tempCompanies.filter((c) => c !== companyName));
    } else {
      setTempCompanies([...tempCompanies, companyName]);
    }
  };

  // Handle learning objectives editing
  const handleLearningObjectivesEdit = () => {
    setIsEditingLearningObjectives(true);
  };

  const handleLearningObjectivesSave = () => {
    const currentObjectives = getEffectiveLearningObjectives({
      id: course.id,
      learning_objectives: course.learning_objectives,
    });
    if (
      JSON.stringify(tempLearningObjectives) !==
      JSON.stringify(currentObjectives)
    ) {

      // Store learning objectives locally for immediate persistence
      setStoredLearningObjectives(course.id, tempLearningObjectives);

      // Force refresh to reflect localStorage changes immediately
      setLearningObjectivesRefreshKey((prev) => prev + 1);

      // Query invalidation for frontend synchronization
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });

      success(
        "Learning Objectives Updated",
        "Learning objectives have been updated and will be reflected in the frontend."
      );
    } else {
    }
    setIsEditingLearningObjectives(false);
  };

  const handleLearningObjectivesCancel = () => {
    setTempLearningObjectives(courseLearningObjectives);
    setIsEditingLearningObjectives(false);
  };

  const handleLearningObjectiveAdd = () => {
    setTempLearningObjectives([
      ...tempLearningObjectives,
      "New learning objective",
    ]);
  };

  const handleLearningObjectiveDelete = (index: number) => {
    setTempLearningObjectives(
      tempLearningObjectives.filter((_, i) => i !== index)
    );
  };

  const handleLearningObjectiveChange = (index: number, value: string) => {
    const updated = [...tempLearningObjectives];
    updated[index] = value;
    setTempLearningObjectives(updated);
  };

  // Handle course tags editing
  const handleTagsEdit = () => {
    setIsEditingTags(true);
  };

  const handleTagsSave = () => {
    const currentTags = getEffectiveCourseTags({
      id: course.id,
      tags: course.tags,
      title: course.title,
      difficulty_level: course.difficulty_level,
    });
    if (
      JSON.stringify(tempTags.sort()) !== JSON.stringify(currentTags.sort())
    ) {

      // Store tags locally for immediate persistence
      setStoredCourseTags(course.id, tempTags);

      // Force refresh to reflect localStorage changes immediately
      setTagsRefreshKey((prev) => prev + 1);

      // Query invalidation for frontend synchronization
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });

      success(
        "Course Tags Updated",
        "Course tags have been updated and will be reflected in the frontend."
      );
    } else {
    }
    setIsEditingTags(false);
  };

  const handleTagsCancel = () => {
    setTempTags(courseTags);
    setIsEditingTags(false);
  };

  const handleTagToggle = (tag: string) => {
    if (tempTags.includes(tag)) {
      setTempTags(tempTags.filter((t) => t !== tag));
    } else {
      setTempTags([...tempTags, tag]);
    }
  };

  // Handle student stats editing
  const handleStudentStatsEdit = () => {
    setIsEditingStudentStats(true);
  };

  const handleStudentStatsSave = () => {
    const currentStats = getEffectiveStudentStats({
      id: course.id,
      rating: course.rating,
      enrolled_students: course.enrolled_students,
    });
    if (JSON.stringify(tempStudentStats) !== JSON.stringify(currentStats)) {

      // Store student stats locally for immediate persistence
      setStoredStudentStats(course.id, tempStudentStats);

      // Force refresh to reflect localStorage changes immediately
      setStudentStatsRefreshKey((prev) => prev + 1);

      // Query invalidation for frontend synchronization
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });

      success(
        "Student Stats Updated",
        "Student rating statistics have been updated and will be reflected in the frontend."
      );
    } else {
    }
    setIsEditingStudentStats(false);
  };

  const handleStudentStatsCancel = () => {
    setTempStudentStats(courseStudentStats);
    setIsEditingStudentStats(false);
  };

  // Handle job placement editing
  const handleJobPlacementEdit = () => {
    setIsEditingJobPlacement(true);
  };

  const handleJobPlacementSave = () => {
    const currentPlacement = getEffectiveJobPlacement({
      id: course.id,
      enrolled_students: course.enrolled_students,
    });
    if (JSON.stringify(tempJobPlacement) !== JSON.stringify(currentPlacement)) {

      // Store job placement locally for immediate persistence
      setStoredJobPlacement(course.id, tempJobPlacement);

      // Force refresh to reflect localStorage changes immediately
      setJobPlacementRefreshKey((prev) => prev + 1);

      // Query invalidation for frontend synchronization
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });

      success(
        "Job Placement Updated",
        "Job placement information has been updated and will be reflected in the frontend."
      );
    } else {
    }
    setIsEditingJobPlacement(false);
  };

  const handleJobPlacementCancel = () => {
    setTempJobPlacement(courseJobPlacement);
    setIsEditingJobPlacement(false);
  };

  // Handle what's included save
  const handleWhatsIncludedSave = () => {
    if (whatsIncludedError) return;


    try {
      setStoredWhatsIncluded(course.id, tempWhatsIncluded);
      setIsEditingWhatsIncluded(false);
      setWhatsIncludedRefreshKey((prev) => prev + 1);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["course", course.id] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });

    } catch (error) {
      // Failed to save what's included
    }
  };

  // Handle what's included cancel
  const handleWhatsIncludedCancel = () => {
    const currentWhatsIncluded = getEffectiveWhatsIncluded({
      id: course.id,
      whats_included: course.whats_included,
      stats: course.stats,
    });
    setTempWhatsIncluded(currentWhatsIncluded);
    setIsEditingWhatsIncluded(false);
    setWhatsIncludedError("");
    setNewWhatsIncludedItem("");
  };

  // Handle add what's included item
  const handleAddWhatsIncludedItem = () => {
    if (!newWhatsIncludedItem.trim()) {
      setWhatsIncludedError("Please enter an item");
      return;
    }

    if (tempWhatsIncluded.includes(newWhatsIncludedItem.trim())) {
      setWhatsIncludedError("This item already exists");
      return;
    }

    setTempWhatsIncluded([...tempWhatsIncluded, newWhatsIncludedItem.trim()]);
    setNewWhatsIncludedItem("");
    setWhatsIncludedError("");
  };

  // Handle remove what's included item
  const handleRemoveWhatsIncludedItem = (index: number) => {
    const newItems = tempWhatsIncluded.filter((_, i) => i !== index);
    setTempWhatsIncluded(newItems);
  };

  // === FEATURES HANDLERS ===

  // Handle features save
  const handleFeaturesSave = () => {
    if (featuresError) return;


    try {
      setStoredFeatures(course.id, tempFeatures);
      setIsEditingFeatures(false);
      setFeaturesRefreshKey((prev) => prev + 1);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["course", course.id] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });

    } catch (error) {
      // Failed to save features
    }
  };

  // Handle features cancel
  const handleFeaturesCancel = () => {
    const currentFeatures = getEffectiveFeatures({
      id: course.id,
      features: course.features,
      stats: course.stats,
    });
    setTempFeatures(currentFeatures);
    setIsEditingFeatures(false);
    setFeaturesError("");
    setNewFeatureItem("");
  };

  // Handle add feature item
  const handleAddFeatureItem = () => {
    if (!newFeatureItem.trim()) {
      setFeaturesError("Please enter a feature");
      return;
    }

    if (tempFeatures.includes(newFeatureItem.trim())) {
      setFeaturesError("This feature already exists");
      return;
    }

    setTempFeatures([...tempFeatures, newFeatureItem.trim()]);
    setNewFeatureItem("");
    setFeaturesError("");
  };

  // Handle remove feature item
  const handleRemoveFeatureItem = (index: number) => {
    const newItems = tempFeatures.filter((_, i) => i !== index);
    setTempFeatures(newItems);
  };

  // === REQUIREMENTS HANDLERS ===

  // Handle requirements save
  const handleRequirementsSave = () => {
    if (requirementsError) return;


    try {
      setStoredRequirements(course.id, tempRequirements);
      setIsEditingRequirements(false);
      setRequirementsRefreshKey((prev) => prev + 1);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["course", course.id] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });

    } catch (error) {
      // Failed to save requirements
    }
  };

  // Handle requirements cancel
  const handleRequirementsCancel = () => {
    const currentRequirements = getEffectiveRequirements({
      id: course.id,
      requirements: course.requirements,
      difficulty_level: course.difficulty_level,
    });
    setTempRequirements(currentRequirements);
    setIsEditingRequirements(false);
    setRequirementsError("");
    setNewRequirementItem("");
  };

  // Handle instructors editing
  const handleInstructorsEdit = () => {
    setIsEditingInstructors(true);
  };

  const handleInstructorToggle = (instructor: {
    id: number;
    name: string;
    profile_pic_url?: string;
  }) => {
    const isSelected = tempInstructors.some((i) => i.id === instructor.id);
    if (isSelected) {
      setTempInstructors(tempInstructors.filter((i) => i.id !== instructor.id));
    } else {
      setTempInstructors([...tempInstructors, instructor]);
    }
  };

  const handleInstructorsSave = () => {
    const currentInstructors = courseInstructors;
    if (
      JSON.stringify(tempInstructors?.sort((a: any, b: any) => a.id - b.id)) !==
      JSON.stringify(currentInstructors.sort((a: any, b: any) => a.id - b.id))
    ) {

      // Store instructors in centralized localStorage that frontend can access
      setStoredInstructors(course.id, tempInstructors as any);

      // Force immediate UI refresh
      setInstructorsRefreshKey((prev) => prev + 1);

      // Query invalidation for synchronization
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["all-courses"] });

      // Additional refresh cycle for persistence
      setTimeout(() => {
        setInstructorsRefreshKey((prev) => prev + 1);
      }, 100);

      success(
        "Instructors Updated",
        "Course instructors have been updated and will reflect in frontend immediately."
      );
    } else {
    }
    setIsEditingInstructors(false);
  };

  const handleInstructorsCancel = () => {
    setTempInstructors(courseInstructors as any);
    setIsEditingInstructors(false);
  };

  // Handle add requirement item
  const handleAddRequirementItem = () => {
    if (!newRequirementItem.trim()) {
      setRequirementsError("Please enter a requirement");
      return;
    }

    if (tempRequirements.includes(newRequirementItem.trim())) {
      setRequirementsError("This requirement already exists");
      return;
    }

    setTempRequirements([...tempRequirements, newRequirementItem.trim()]);
    setNewRequirementItem("");
    setRequirementsError("");
  };

  // Handle remove requirement item
  const handleRemoveRequirementItem = (index: number) => {
    const newItems = tempRequirements.filter((_, i) => i !== index);
    setTempRequirements(newItems);
  };

  const formattedPrice = course.is_free ? "Free" : `₹${course.price}`;

  // Get rating and difficulty using centralized logic
  const courseRating = React.useMemo(() => {
    const effectiveRating = getEffectiveRating(course);
    return effectiveRating;
  }, [course]);

  const courseDifficulty = React.useMemo(() => {
    const effectiveDifficulty = getEffectiveDifficulty({
      id: course.id,
      difficulty_level: course.difficulty_level,
    });
    return effectiveDifficulty;
  }, [course]);

  const courseCompanies = React.useMemo(() => {
    const effectiveCompanies = getEffectiveCompanies({ id: course.id });
    return effectiveCompanies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, companiesRefreshKey]); // companiesRefreshKey needed to force re-render after localStorage changes

  const courseLearningObjectives = React.useMemo(() => {
    const effectiveObjectives = getEffectiveLearningObjectives({
      id: course.id,
      learning_objectives: course.learning_objectives,
    });
    return effectiveObjectives;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, learningObjectivesRefreshKey]);

  const courseStudentStats = React.useMemo(() => {
    const effectiveStats = getEffectiveStudentStats({
      id: course.id,
      rating: course.rating,
      enrolled_students: course.enrolled_students,
    });
    return effectiveStats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, studentStatsRefreshKey]);

  const courseJobPlacement = React.useMemo(() => {
    const effectivePlacement = getEffectiveJobPlacement({
      id: course.id,
      enrolled_students: course.enrolled_students,
    });
    return effectivePlacement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, jobPlacementRefreshKey]);

  const courseWhatsIncluded = React.useMemo(() => {
    const effectiveIncluded = getEffectiveWhatsIncluded({
      id: course.id,
      whats_included: course.whats_included,
      stats: course.stats,
    });
    return effectiveIncluded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, whatsIncludedRefreshKey]);

  const courseTags = React.useMemo(() => {
    const effectiveTags = getEffectiveCourseTags({
      id: course.id,
      tags: course.tags,
      title: course.title,
      difficulty_level: course.difficulty_level,
    });
    return effectiveTags;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, tagsRefreshKey]);

  const courseFeatures = React.useMemo(() => {
    const effectiveFeatures = getEffectiveFeatures({
      id: course.id,
      features: course.features,
      stats: course.stats,
    });
    return effectiveFeatures;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, featuresRefreshKey]);

  const courseRequirements = React.useMemo(() => {
    const effectiveRequirements = getEffectiveRequirements({
      id: course.id,
      requirements: course.requirements,
      difficulty_level: course.difficulty_level,
    });

    return effectiveRequirements;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, requirementsRefreshKey]);

  const courseInstructors = React.useMemo(() => {
    const effectiveInstructors = getEffectiveInstructors(course);
    return effectiveInstructors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, instructorsRefreshKey]);

  const courseDuration = getEffectiveDuration({
    id: course.id,
    duration_in_hours: course.duration_in_hours,
  });

  // Update temp values when course data changes
  useEffect(() => {
    setTempTitle(course.title);
    setTempDescription(course.description);
    setTempRating(courseRating);
    setTempDifficulty(courseDifficulty);
    setTempDuration(courseDuration);
    setTempCompanies(courseCompanies.map((c) => c.name));
    setTempLearningObjectives(courseLearningObjectives);
    setTempTags(courseTags);
    setTempStudentStats(courseStudentStats);
    setTempJobPlacement(courseJobPlacement);
    setTempWhatsIncluded(courseWhatsIncluded);
    setTempFeatures(courseFeatures);
    setTempRequirements(courseRequirements);
    setTempInstructors(getEffectiveInstructors(course));

    // Auto-cleanup problematic hardcoded tags when admin loads
    cleanUpHardcodedTags();
  }, [
    course,
    courseRating,
    courseDifficulty,
    courseDuration,
    courseCompanies,
    courseLearningObjectives,
    courseTags,
    courseStudentStats,
    courseJobPlacement,
    courseWhatsIncluded,
    courseFeatures,
    courseRequirements,
  ]);

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

        {/* Created and Certified By - Editable */}
        {isEditingCompanies ? (
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[11px] text-[var(--font-tertiary)] font-normal uppercase tracking-[0.5px]">
              Created and certified by
            </span>
            <div className="flex flex-col gap-2 w-full">
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                {getAllAvailableCompanies().map((company) => (
                  <label
                    key={company}
                    className="flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={tempCompanies.includes(company)}
                      onChange={() => handleCompanyToggle(company)}
                      className="w-3 h-3"
                    />
                    <span>{company}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCompanySave}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={handleCompanyCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 flex-wrap cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
            onClick={handleCompanyEdit}
            title="Click to edit companies"
          >
            <span className="text-[11px] text-[var(--font-tertiary)] font-normal uppercase tracking-[0.5px]">
              Created and certified by
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {courseCompanies.slice(0, 3).map((company, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-md text-[11px] font-semibold text-[#475569] hover:shadow-sm transition-shadow duration-200"
                >
                  <img
                    src={company.logoUrl}
                    alt={company.alt}
                    className="w-4 h-4 object-contain"
                  />
                  <span>{company.name}</span>
                </div>
              ))}
              <svg
                className="w-3 h-3 text-gray-400 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5l7 7-7 7M4 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 md:p-6">
        {/* Course Info Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Editable Difficulty Level */}
          {isEditingDifficulty ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <svg
                className="w-3 h-3 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <select
                ref={difficultySelectRef}
                value={tempDifficulty}
                onChange={(e) => setTempDifficulty(e.target.value)}
                onBlur={handleDifficultySave}
                onKeyDown={handleDifficultyKeyDown}
                className="text-xs font-medium bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          ) : (
            <span
              onClick={handleDifficultyEdit}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors group"
              title="Click to edit difficulty"
            >
              <svg
                className="w-3 h-3 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {courseDifficulty}
              <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ✏️
              </span>
            </span>
          )}
          {/* Editable Duration */}
          {isEditingDuration ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <svg
                className="w-3 h-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <input
                ref={durationInputRef}
                type="number"
                min="1"
                max="200"
                value={tempDuration}
                onChange={(e) => setTempDuration(Number(e.target.value))}
                onBlur={handleDurationSave}
                onKeyDown={handleDurationKeyDown}
                className="w-12 text-xs font-medium bg-transparent border-none focus:outline-none text-center"
              />
              <span className="text-xs font-medium">hours</span>
            </div>
          ) : (
            <span
              onClick={handleDurationEdit}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors group"
              title="Click to edit duration"
            >
              <svg
                className="w-3 h-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {courseDuration} hours
              <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ✏️
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-800 whitespace-nowrap">
            {formattedPrice}
          </span>
          {/* Editable Rating */}
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={courseRating} size="text-xs" />
            {isEditingRating ? (
              <div className="flex items-center gap-1">
                <input
                  ref={ratingInputRef}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={tempRating}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setTempRating(isNaN(value) ? 0 : value);
                  }}
                  onBlur={handleRatingSave}
                  onKeyDown={handleRatingKeyDown}
                  className="w-12 text-xs font-semibold text-gray-700 bg-transparent border-b border-blue-500 focus:outline-none text-center"
                />
                <span className="text-xs font-semibold text-gray-700">/5</span>
              </div>
            ) : (
              <span
                onClick={handleRatingEdit}
                className="text-xs font-semibold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors group"
                title="Click to edit rating"
              >
                {courseRating}/5
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ✏️
                </span>
              </span>
            )}
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

        {/* Instructor Section - Editable */}
        {isEditingInstructors ? (
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Course Instructors (Editing):
            </h4>
            <div className="grid grid-cols-1 gap-3 mb-3 max-h-48 overflow-y-auto">
              {DEFAULT_INSTRUCTORS.map((instructor) => (
                <label
                  key={instructor.id}
                  className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded hover:bg-blue-100"
                >
                  <input
                    type="checkbox"
                    checked={tempInstructors.some(
                      (i) => i.id === instructor.id
                    )}
                    onChange={() => handleInstructorToggle(instructor)}
                    className="w-4 h-4"
                  />
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                    <img
                      src={
                        instructor.profile_pic_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          instructor.name
                        )}&background=6366f1&color=fff`
                      }
                      alt={instructor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium">{instructor.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstructorsSave}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleInstructorsCancel}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="text-xs font-semibold text-[var(--font-secondary)] mb-3 uppercase tracking-[0.5px] flex items-center justify-between">
              <span>Instructors</span>
              <div title="Click to edit instructors">
                <svg
                  className="w-3 h-3 text-gray-400 cursor-pointer hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  onClick={handleInstructorsEdit}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5l7 7-7 7M4 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
            {courseInstructors && courseInstructors.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-3">
                    {courseInstructors.slice(0, 3).map((instructor) => (
                      <div
                        key={instructor.id}
                        className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gray-300 relative"
                        title={instructor.name}
                      >
                        <img
                          src={
                            instructor.profile_pic_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              instructor?.name ? instructor?.name : "IN"
                            )}&background=6366f1&color=fff`
                          }
                          alt={instructor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[var(--font-secondary)] leading-relaxed">
                  {courseInstructors[0]?.name || "Expert Instructor"}
                  {courseInstructors.length > 1 &&
                    ` +${courseInstructors.length - 1} more`}
                </p>
              </div>
            ) : (
              <div
                className="text-xs text-gray-500 italic cursor-pointer hover:text-blue-500"
                onClick={handleInstructorsEdit}
              >
                No instructors assigned. Click to add instructors.
              </div>
            )}
          </div>
        )}

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

        {/* Learning Objectives - What you'll learn - Editable */}
        {isEditingLearningObjectives ? (
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              What you'll learn: (Editing)
            </h3>
            <div className="space-y-3">
              {tempLearningObjectives.map((objective, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-xs mt-2 flex-shrink-0">
                    ✓
                  </span>
                  <textarea
                    value={objective}
                    onChange={(e) =>
                      handleLearningObjectiveChange(index, e.target.value)
                    }
                    className="flex-1 text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={() => handleLearningObjectiveDelete(index)}
                    className="text-red-500 hover:text-red-700 text-xs mt-1"
                    title="Delete objective"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleLearningObjectiveAdd}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  Add Objective
                </button>
                <button
                  onClick={handleLearningObjectivesSave}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={handleLearningObjectivesCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            onClick={handleLearningObjectivesEdit}
            title="Click to edit learning objectives"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              What you'll learn:
              <svg
                className="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5l7 7-7 7M4 5l7 7-7 7"
                />
              </svg>
            </h3>
            <ul className="space-y-2">
              {courseLearningObjectives.slice(0, 4).map((objective, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-gray-600"
                >
                  <span className="text-green-600 font-bold text-xs mt-0.5 flex-shrink-0">
                    ✓
                  </span>
                  <span className="leading-relaxed">{objective.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Course Tags - Editable */}
        {isEditingTags ? (
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Course Tags (Editing):
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {DEFAULT_AVAILABLE_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={tempTags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                    className="w-3 h-3"
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTagsSave}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleTagsCancel}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {

                    // Step 1: Clear all tags for this course immediately
                    setTempTags([]);

                    // Step 2: Run global cleanup first to remove problematic tags
                    cleanUpHardcodedTags();

                    // Step 3: Force immediate save of empty tags for this course
                    setStoredCourseTags(course.id, []);

                    // Step 4: Multiple state refreshes to ensure UI sync
                    setTagsRefreshKey((prev) => prev + 1);

                    // Step 5: Wait a moment for localStorage to settle
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    // Step 6: Force another refresh cycle
                    setTagsRefreshKey((prev) => prev + 1);

                    // Step 7: Comprehensive query invalidation
                    await queryClient.invalidateQueries({
                      queryKey: ["courses"],
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ["all-courses"],
                    });
                    await queryClient.refetchQueries({ queryKey: ["courses"] });

                    // Step 8: Final state update
                    setTimeout(() => {
                      setTagsRefreshKey((prev) => prev + 1);
                    }, 200);

                    success(
                      "All Tags Cleared",
                      "Removed all tags from this course and cleaned up problematic tags globally. Changes are now reflected in both admin and frontend."
                    );

                    // Exit edit mode since changes are saved
                    setIsEditingTags(false);
                  } catch (error) {
                    // Error during tag cleanup
                    success(
                      "Cleanup Error",
                      "There was an issue during cleanup. Please try again."
                    );
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                title="Remove all tags from this course and clean up problematic hardcoded tags globally (including 'adsfdasfadf')"
              >
                Clear All Tags
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-wrap gap-2 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            onClick={handleTagsEdit}
            title="Click to edit tags"
          >
            {courseTags.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-[var(--font-light)] rounded-full text-xs font-semibold whitespace-nowrap"
              >
                {tag}
              </div>
            ))}
            <svg
              className="w-3 h-3 text-gray-400 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5l7 7-7 7M4 5l7 7-7 7"
              />
            </svg>
          </div>
        )}

        {/* Enhanced Rating Section - Editable */}
        {isEditingStudentStats ? (
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Student Statistics (Editing):
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Rating (0-5):
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={tempStudentStats.rating}
                  onChange={(e) =>
                    setTempStudentStats({
                      ...tempStudentStats,
                      rating: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Total Learners:
                </label>
                <input
                  type="number"
                  min="1"
                  value={tempStudentStats.totalLearners}
                  onChange={(e) =>
                    setTempStudentStats({
                      ...tempStudentStats,
                      totalLearners: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStudentStatsSave}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleStudentStatsCancel}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={handleStudentStatsEdit}
            title="Click to edit student statistics"
          >
            <StarRating rating={courseStudentStats.rating} size="text-sm" />
            <span className="text-sm font-semibold text-gray-700">
              {courseStudentStats.rating}/5 rating from{" "}
              {courseStudentStats.totalLearners}+ learners
            </span>
            <svg
              className="w-3 h-3 text-gray-400 ml-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5l7 7-7 7M4 5l7 7-7 7"
              />
            </svg>
          </div>
        )}

        {/* Student Success Stories - Job Placement - Editable */}
        {isEditingJobPlacement ? (
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Job Placement Info (Editing):
            </h4>
            <div className="grid grid-cols-1 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Total Learners Who Got Jobs:
                </label>
                <input
                  type="number"
                  min="1"
                  value={tempJobPlacement.totalLearners}
                  onChange={(e) =>
                    setTempJobPlacement({
                      ...tempJobPlacement,
                      totalLearners: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Companies (comma separated):
                </label>
                <input
                  type="text"
                  value={tempJobPlacement.companies.join(", ")}
                  onChange={(e) =>
                    setTempJobPlacement({
                      ...tempJobPlacement,
                      companies: e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter((c) => c),
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  placeholder="Deloitte, TCS, Accenture"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleJobPlacementSave}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleJobPlacementCancel}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-4 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            onClick={handleJobPlacementEdit}
            title="Click to edit job placement info"
          >
            <div className="flex items-center">
              {courseJobPlacement.companies
                .slice(0, 3)
                .map((company, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-[var(--font-light)] ${
                      index === 0
                        ? "bg-blue-500 ml-0"
                        : index === 1
                        ? "bg-cyan-500 -ml-2"
                        : "bg-purple-500 -ml-2"
                    } relative z-${index + 1}`}
                  >
                    {company.slice(0, 2).toUpperCase()}
                  </div>
                ))}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Join {courseJobPlacement.totalLearners}+ learners who landed
                jobs at
                <br />
                {courseJobPlacement.companies.join(", ")} with these skills
              </p>
            </div>
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5l7 7-7 7M4 5l7 7-7 7"
              />
            </svg>
          </div>
        )}

        {/* What's Included - Editable */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800">
              🎁 What's Included:
            </h4>
            {!isEditingWhatsIncluded && (
              <button
                onClick={() => setIsEditingWhatsIncluded(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingWhatsIncluded ? (
            <div className="space-y-3">
              {/* Existing items list */}
              <div className="space-y-2">
                {tempWhatsIncluded.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 text-xs text-blue-800 bg-white p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>{item}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveWhatsIncludedItem(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWhatsIncludedItem}
                    onChange={(e) => setNewWhatsIncludedItem(e.target.value)}
                    placeholder="Add new item..."
                    className="flex-1 text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddWhatsIncludedItem();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddWhatsIncludedItem}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {whatsIncludedError && (
                  <p className="text-xs text-red-600">{whatsIncludedError}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleWhatsIncludedSave}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleWhatsIncludedCancel}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {courseWhatsIncluded.slice(0, 4).map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-xs text-blue-800"
                >
                  <span className="text-xs text-blue-600">✓</span>
                  {item}
                </li>
              ))}
              {courseWhatsIncluded.length > 4 && (
                <li className="text-xs text-blue-600 font-medium">
                  +{courseWhatsIncluded.length - 4} more items
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Course Features - Editable */}
        <div className="mb-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h4 className="text-sm font-semibold text-gray-700">
                Course Features
              </h4>
            </div>
            {!isEditingFeatures && (
              <button
                onClick={() => setIsEditingFeatures(true)}
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingFeatures ? (
            <div className="space-y-3">
              {/* Existing features list */}
              <div className="space-y-2">
                {tempFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{feature}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFeatureItem(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new feature */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureItem}
                    onChange={(e) => setNewFeatureItem(e.target.value)}
                    placeholder="Add new feature..."
                    className="flex-1 text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddFeatureItem();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddFeatureItem}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
                {featuresError && (
                  <p className="text-xs text-red-600">{featuresError}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleFeaturesSave}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleFeaturesCancel}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {courseFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-xs text-gray-600"
                >
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Course Requirements - Editable */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-yellow-800">
              📋 Requirements:
            </h4>
            {!isEditingRequirements && (
              <button
                onClick={() => setIsEditingRequirements(true)}
                className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingRequirements ? (
            <div className="space-y-3">
              {/* Existing requirements list */}
              <div className="space-y-2">
                {tempRequirements.map((requirement, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 text-xs text-yellow-800 bg-white p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">•</span>
                      <span>{requirement}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveRequirementItem(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new requirement */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirementItem}
                    onChange={(e) => setNewRequirementItem(e.target.value)}
                    placeholder="Add new requirement..."
                    className="flex-1 text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddRequirementItem();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddRequirementItem}
                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Add
                  </button>
                </div>
                {requirementsError && (
                  <p className="text-xs text-red-600">{requirementsError}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleRequirementsSave}
                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Save
                </button>
                <button
                  onClick={handleRequirementsCancel}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {courseRequirements.map((requirement, index) => (
                <p
                  key={index}
                  className="text-xs text-yellow-800 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>{requirement}</span>
                </p>
              ))}
            </div>
          )}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Course Content
        </button>
      </div>
    </div>
  );
};

export default AdminCourseCard;
