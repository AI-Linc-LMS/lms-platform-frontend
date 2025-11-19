import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ResumeData, PersonalInfo, Experience, Education, Skill, SkillCategory, Project, Activity, Volunteering, Award } from "../types/resume";
import PersonalInfoForm from "./PersonalInfoForm";
import SkillsForm from "./SkillsForm";
import ExperienceForm from "./ExperienceForm";
import EducationForm from "./EducationForm";
import ProjectsForm from "./ProjectsForm";
import ActivitiesForm from "./ActivitiesForm";
import VolunteeringForm from "./VolunteeringForm";
import AwardsForm from "./AwardsForm";

interface Section {
  id: string;
  label: string;
  subsections?: string[];
  icon?: React.ReactNode;
}

interface ResumeSidebarProps {
  activeSection: string;
  activeSubsection?: string;
  onSectionChange: (sectionId: string, subsection?: string) => void;
  onReset: () => void;
  sectionOrder?: string[];
  onSectionOrderChange?: (newOrder: string[]) => void;
  resumeData: ResumeData;
  onPersonalInfoChange: (data: PersonalInfo) => void;
  onExperienceChange: (data: Experience[]) => void;
  onEducationChange: (data: Education[]) => void;
  onSkillsChange: (data: Skill[]) => void;
  onProjectsChange: (data: Project[]) => void;
  onActivitiesChange: (data: Activity[]) => void;
  onVolunteeringChange: (data: Volunteering[]) => void;
  onAwardsChange: (data: Award[]) => void;
  onPreviewCategory?: (category: SkillCategory) => void;
}

const allSections: Section[] = [
  {
    id: "personal",
    label: "Basic Details",
    // No subsections - handled internally by PersonalInfoForm tabs
  },
  { id: "skills", label: "Skills and Expertise" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "activities", label: "Activities" },
  { id: "volunteering", label: "Volunteering" },
  { id: "awards", label: "Awards" },
];

const subsectionLabels: Record<string, Record<string, string>> = {
  personal: {
    contacts: "Contacts",
    links: "Links",
    about: "About",
  },
};

const SortableSection: React.FC<{
  section: Section;
  isActive: boolean;
  activeSubsection?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onSubsectionClick: (subsection: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}> = ({
  section,
  isActive,
  activeSubsection,
  isExpanded,
  onToggle,
  onClick,
  onSubsectionClick,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionIcon = (sectionId: string) => {
    const iconClass = "w-5 h-5";
    switch (sectionId) {
      case "personal":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "experience":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
          </svg>
        );
      case "education":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
      case "skills":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case "projects":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case "activities":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case "volunteering":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case "awards":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <button
            onClick={onClick}
            onDoubleClick={onToggle}
            className={`flex-1 flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 font-medium ${
              isActive && !activeSubsection
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-[1.02]"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {getSectionIcon(section.id)}
              <span className="text-sm font-semibold">{section.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Inline Up/Down Arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp?.();
                  }}
                  disabled={!canMoveUp}
                  className={`p-0.5 rounded transition-all duration-200 ${
                    isActive && !activeSubsection
                      ? "text-white hover:bg-white/20 disabled:text-white/30 disabled:cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                  }`}
                  title="Move up"
                  aria-label="Move section up"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown?.();
                  }}
                  disabled={!canMoveDown}
                  className={`p-0.5 rounded transition-all duration-200 ${
                    isActive && !activeSubsection
                      ? "text-white hover:bg-white/20 disabled:text-white/30 disabled:cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                  }`}
                  title="Move down"
                  aria-label="Move section down"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {/* Don't show expand arrow for personal section - tabs handled internally */}
              {section.subsections && section.subsections.length > 0 && section.id !== "personal" && (
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ml-1 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          </button>
        </div>
        {/* Subsections - Only show for non-personal sections if needed */}
        {section.subsections && section.subsections.length > 0 && section.id !== "personal" && isExpanded && (
          <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-3 py-1">
            {section.subsections.map((subsection) => {
              const isSubsectionActive = activeSubsection === subsection;
              const label = subsectionLabels[section.id]?.[subsection] || subsection;
              return (
                  <button
                    key={subsection}
                    onClick={() => onSubsectionClick(subsection)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 font-medium ${
                      isSubsectionActive
                        ? "bg-blue-100 text-blue-700 font-semibold border border-blue-300 shadow-sm"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ResumeSidebar: React.FC<ResumeSidebarProps> = ({
  activeSection,
  activeSubsection,
  onSectionChange,
  onReset,
  sectionOrder,
  onSectionOrderChange,
  resumeData,
  onPersonalInfoChange,
  onExperienceChange,
  onEducationChange,
  onSkillsChange,
  onProjectsChange,
  onActivitiesChange,
  onVolunteeringChange,
  onAwardsChange,
  onPreviewCategory,
}) => {
  const [viewMode, setViewMode] = useState<"sections" | "form">("sections");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([activeSection])
  );
  // formRefs removed - not currently used

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use provided sectionOrder or default order
  const orderedSections = React.useMemo(() => {
    const order = sectionOrder || allSections.map((s) => s.id);
    return order
      .map((id) => allSections.find((s) => s.id === id))
      .filter((s): s is Section => s !== undefined)
      .concat(allSections.filter((s) => !order.includes(s.id)));
  }, [sectionOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedSections.findIndex((s) => s.id === active.id);
      const newIndex = orderedSections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(orderedSections, oldIndex, newIndex).map((s) => s.id);
      onSectionOrderChange?.(newOrder);
    }
  };

  // Initialize view mode based on activeSection
  useEffect(() => {
    if (activeSection && viewMode === "sections") {
      // Don't auto-switch to form on mount if we want to start with sections view
      // Only switch when user explicitly clicks a section
    } else if (!activeSection) {
      setViewMode("sections");
    }
  }, [activeSection]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setViewMode("form");
    // Scroll to top when entering form view
    setTimeout(() => {
      const sidebar = document.querySelector('[data-sidebar-content]');
      if (sidebar) {
        sidebar.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  };



  const moveSection = (sectionId: string, direction: "up" | "down") => {
    const currentIndex = orderedSections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= orderedSections.length) return;

    const newOrder = arrayMove(orderedSections, currentIndex, newIndex).map((s) => s.id);
    onSectionOrderChange?.(newOrder);
  };

  const renderFormContent = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        return (
          <PersonalInfoForm
            data={resumeData.personalInfo}
            onChange={onPersonalInfoChange}
            activeSubsection={activeSubsection || "contacts"}
            onSubsectionChange={(subsection) => onSectionChange(sectionId, subsection)}
          />
        );
      case "experience":
        return <ExperienceForm data={resumeData.experience} onChange={onExperienceChange} />;
      case "education":
        return <EducationForm data={resumeData.education} onChange={onEducationChange} />;
      case "skills":
        return <SkillsForm data={resumeData.skills} onChange={onSkillsChange} onPreviewCategory={onPreviewCategory} />;
      case "projects":
        return <ProjectsForm data={resumeData.projects} onChange={onProjectsChange} />;
      case "activities":
        return <ActivitiesForm data={resumeData.activities} onChange={onActivitiesChange} />;
      case "volunteering":
        return <VolunteeringForm data={resumeData.volunteering} onChange={onVolunteeringChange} />;
      case "awards":
        return <AwardsForm data={resumeData.awards} onChange={onAwardsChange} />;
      default:
        return null;
    }
  };

  const getSectionLabel = (sectionId: string) => {
    return allSections.find((s) => s.id === sectionId)?.label || sectionId;
  };

      return (
        <div className="w-1/4 min-w-[320px] bg-white border-l border-gray-100 h-full overflow-y-auto shadow-sm flex flex-col" style={{ overflowX: 'hidden', maxWidth: '25%' }}>
      <div className="p-4 flex-1" data-sidebar-content>
        {/* Form View - Show only when a section is selected */}
        {viewMode === "form" && activeSection ? (
          <>
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white z-10 pb-3 border-b border-gray-100">
              <button
                onClick={() => setViewMode("sections")}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 flex-shrink-0"
                title="Back to sections"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-2 flex-1">
                {(() => {
                  const iconClass = "w-5 h-5";
                  const sectionIcon = (() => {
                    switch (activeSection) {
                      case "personal":
                        return (
                          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        );
                      case "experience":
                        return (
                          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                          </svg>
                        );
                      case "education":
                        return (
                          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                        );
                      case "skills":
                        return (
                          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        );
                      default:
                        return (
                          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        );
                    }
                  })();
                  return sectionIcon;
                })()}
                    <h2 className="text-base font-bold text-gray-900">{getSectionLabel(activeSection)}</h2>
              </div>
            </div>
            {/* Form Content */}
            <div className="pb-4">
              {renderFormContent(activeSection)}
            </div>
          </>
        ) : (
          <>
                {/* Sections View - Default */}
                <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white z-10 pb-3 border-b border-gray-100">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Sections</h2>
                </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {orderedSections.map((section, index) => {
                const isActive = activeSection === section.id;
                const isExpanded = expandedSections.has(section.id);

                return (
                  <div key={section.id} className="relative group mb-2">
                    <div className="bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md"
                      style={{
                        borderColor: isActive ? "#3b82f6" : "#e5e7eb",
                        boxShadow: isActive ? "0 2px 8px rgba(59, 130, 246, 0.15)" : undefined,
                      }}
                    >
                      <SortableSection
                        section={section}
                        isActive={isActive}
                        activeSubsection={activeSubsection}
                        isExpanded={isExpanded}
                        onToggle={() => toggleSection(section.id)}
                        onClick={() => handleSectionClick(section.id)}
                        onSubsectionClick={(subsection) => {
                          onSectionChange(section.id, subsection);
                          handleSectionClick(section.id);
                        }}
                        canMoveUp={index > 0}
                        canMoveDown={index < orderedSections.length - 1}
                        onMoveUp={() => moveSection(section.id, "up")}
                        onMoveDown={() => moveSection(section.id, "down")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
            </>
          )}
        </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onReset}
          className="w-full px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-sm"
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset all edits
          </span>
        </button>
      </div>
    </div>
  );
};

export default ResumeSidebar;
