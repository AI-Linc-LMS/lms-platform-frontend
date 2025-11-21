import React, { useState, useEffect } from "react";
import { Skill, SkillCategory } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";
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

interface SkillsFormProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
  onPreviewCategory?: (category: SkillCategory) => void; // Callback to scroll to specific category in preview
}

const skillCategories: SkillCategory[] = [
  "Language",
  "Framework",
  "Technologies",
  "Libraries",
  "Database",
  "Practices",
  "Tools",
];

const categoryLabels: Record<SkillCategory, string> = {
  Language: "Languages",
  Framework: "Frameworks",
  Technologies: "Technologies",
  Libraries: "Libraries",
  Database: "Databases",
  Practices: "Practices",
  Tools: "Tools",
};

const SortableSkillItem: React.FC<{
  skill: Skill;
  onUpdate: (id: string, field: keyof Skill, value: string) => void;
  onDelete: (id: string) => void;
}> = ({ skill, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 pr-2 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-sm transition-all duration-200"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <input
        type="text"
        value={skill.name}
        onChange={(e) => onUpdate(skill.id, "name", e.target.value)}
        className="flex-1 border-none outline-none font-semibold text-gray-900 bg-transparent min-w-0"
        placeholder="Skill name"
      />

      <button
        onClick={() => onDelete(skill.id)}
        className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md flex-shrink-0"
        title="Remove skill"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

const SkillsForm: React.FC<SkillsFormProps> = ({ data, onChange, onPreviewCategory }) => {
  const [addingToCategory, setAddingToCategory] = useState<SkillCategory | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  // Auto-expand Language category (first category) on mount
  const [expandedCategories, setExpandedCategories] = useState<Set<SkillCategory>>(
    new Set(["Language"])
  );

  // Auto-expand first category with skills, or Language if no skills exist
  useEffect(() => {
    if (data.length > 0) {
      const firstCategoryWithSkills = skillCategories.find((cat) =>
        data.some((skill) => skill.category === cat)
      );
      if (firstCategoryWithSkills && !expandedCategories.has(firstCategoryWithSkills)) {
        setExpandedCategories(new Set([firstCategoryWithSkills]));
      }
    } else {
      if (!expandedCategories.has("Language")) {
        setExpandedCategories(new Set(["Language"]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadSampleData = () => {
    const sampleData: Skill[] = [
      { id: uuidv4(), name: "JavaScript", category: "Language", level: "Expert", priority: 1 },
      { id: uuidv4(), name: "TypeScript", category: "Language", level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "HTML5", category: "Language", level: "Expert", priority: 3 },
      { id: uuidv4(), name: "CSS", category: "Language", level: "Expert", priority: 4 },
      { id: uuidv4(), name: "Python", category: "Language", level: "Advanced", priority: 5 },
      { id: uuidv4(), name: "React", category: "Framework", level: "Expert", priority: 1 },
      { id: uuidv4(), name: "Angular", category: "Framework", level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "Node.js", category: "Framework", level: "Expert", priority: 3 },
      { id: uuidv4(), name: "Algorithms", category: "Technologies", level: "Expert", priority: 1 },
      { id: uuidv4(), name: "Progressive Web Apps", category: "Technologies", level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "SQL", category: "Technologies", level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Data Structures", category: "Technologies", level: "Expert", priority: 4 },
      { id: uuidv4(), name: "jQuery", category: "Libraries", level: "Advanced", priority: 1 },
      { id: uuidv4(), name: "Redux", category: "Libraries", level: "Expert", priority: 2 },
      { id: uuidv4(), name: "Firebase", category: "Database", level: "Advanced", priority: 1 },
      { id: uuidv4(), name: "MongoDB", category: "Database", level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "Component Based Architecture", category: "Practices", level: "Expert", priority: 1 },
      { id: uuidv4(), name: "Agile Methodologies", category: "Practices", level: "Expert", priority: 2 },
      { id: uuidv4(), name: "Design Patterns", category: "Practices", level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Test Driven Development", category: "Practices", level: "Advanced", priority: 4 },
      { id: uuidv4(), name: "MVC", category: "Practices", level: "Advanced", priority: 5 },
      { id: uuidv4(), name: "Git", category: "Tools", level: "Expert", priority: 1 },
      { id: uuidv4(), name: "VS Code", category: "Tools", level: "Expert", priority: 2 },
      { id: uuidv4(), name: "Jira", category: "Tools", level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Webpack", category: "Tools", level: "Advanced", priority: 4 },
      { id: uuidv4(), name: "Eclipse", category: "Tools", level: "Intermediate", priority: 5 },
      { id: uuidv4(), name: "Bitbucket", category: "Tools", level: "Advanced", priority: 6 },
    ];
    onChange(sampleData);
  };

  const handleAddSkillInput = (category: SkillCategory) => {
    const trimmed = newSkillInput.trim();
    if (trimmed) {
      const skillsInCategory = data.filter((s) => s.category === category);
      const maxPriority = skillsInCategory.length > 0
        ? Math.max(...skillsInCategory.map((s) => s.priority))
        : 0;

      const newSkill: Skill = {
        id: uuidv4(),
        name: trimmed,
        category: category,
        level: "Intermediate",
        priority: maxPriority + 1,
      };
      onChange([...data, newSkill]);
      setNewSkillInput("");
      setAddingToCategory(null);
      
      // Auto-expand category after adding
      if (!expandedCategories.has(category)) {
        setExpandedCategories(new Set(expandedCategories).add(category));
      }
    }
  };

  const cancelAddSkill = () => {
    setNewSkillInput("");
    setAddingToCategory(null);
  };

  const startAddingSkill = (category: SkillCategory) => {
    setAddingToCategory(category);
    setNewSkillInput("");
    // Auto-expand category if not expanded
    if (!expandedCategories.has(category)) {
      setExpandedCategories(new Set(expandedCategories).add(category));
    }
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    onChange(
      data.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    );
  };

  const deleteSkill = (id: string) => {
    onChange(data.filter((skill) => skill.id !== id));
  };

  const handleCategoryDragEnd = (event: DragEndEvent, category: SkillCategory) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categorySkills = data
      .filter((s) => s.category === category)
      .sort((a, b) => a.priority - b.priority);

    const oldIndex = categorySkills.findIndex((s) => s.id === active.id);
    const newIndex = categorySkills.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(categorySkills, oldIndex, newIndex);
      const updatedPriorities = reordered.map((skill, index) => ({
        ...skill,
        priority: index + 1,
      }));

      // Update skills with new priorities
      const updatedData = data.map((skill) => {
        if (skill.category === category) {
          const updated = updatedPriorities.find((s) => s.id === skill.id);
          return updated || skill;
        }
        return skill;
      });

      onChange(updatedData);
    }
  };

  const toggleCategory = (category: SkillCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getSkillsByCategory = (category: SkillCategory) => {
    return data
      .filter((s) => s.category === category)
      .sort((a, b) => a.priority - b.priority);
  };


  return (
    <div className="space-y-4">
      <FormHeader
        title="Skills & Objectives"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
      />

      {/* Skills by Category - Show all categories */}
        <div className="space-y-3">
        {skillCategories.map((category) => {
          const categorySkills = getSkillsByCategory(category);
          const isExpanded = expandedCategories.has(category);

          return (
            <div
              key={category}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              {/* Category Header */}
              <div className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 flex-1">
                  {/* Eye/Preview Button - Category Specific */}
                  {onPreviewCategory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewCategory(category);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-md"
                      title={`Preview ${categoryLabels[category]} in resume`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <h5 className="text-base font-bold text-gray-900">
                      {categoryLabels[category]}
                    </h5>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {categorySkills.length}
                  </span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Expand/Collapse Arrow */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Skills List - Expanded */}
              {isExpanded && (
                <div className="p-4 pt-3 space-y-2 bg-gray-50/50">
                  {categorySkills.length === 0 ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="text-gray-500 text-sm">
                        <p>No skills in this category yet.</p>
                        <p className="text-xs mt-1">Click "Add More" to add a skill.</p>
          </div>
                      {/* Add More Button - Moved here */}
                      {addingToCategory !== category ? (
                        <button
                          onClick={() => startAddingSkill(category)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 mx-auto"
                          title={`Add skill to ${categoryLabels[category]}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add More
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-white border-2 border-blue-500 rounded-lg px-3 py-2 shadow-md mx-auto max-w-md">
                          <input
                            type="text"
                            value={newSkillInput}
                            onChange={(e) => setNewSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddSkillInput(category);
                              } else if (e.key === 'Escape') {
                                cancelAddSkill();
                              }
                            }}
                            placeholder="Enter skill name"
                            className="outline-none text-sm font-medium text-gray-900 flex-1 min-w-[150px]"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddSkillInput(category)}
                            className="p-1 text-green-600 hover:text-white hover:bg-green-500 rounded transition-all duration-200"
                            title="Add skill"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelAddSkill}
                            className="p-1 text-red-600 hover:text-white hover:bg-red-500 rounded transition-all duration-200"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
        </div>
      )}
                    </div>
                  ) : (
                    <>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleCategoryDragEnd(event, category)}
                      >
                        <SortableContext
                          items={categorySkills.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {categorySkills.map((skill) => (
                            <SortableSkillItem
                              key={skill.id}
                              skill={skill}
                              onUpdate={updateSkill}
                              onDelete={deleteSkill}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                      {/* Add More Button - Also show when skills exist */}
                      {addingToCategory === category ? (
                        <div className="flex items-center gap-2 bg-white border-2 border-blue-500 rounded-lg px-3 py-2 shadow-md mt-3">
                          <input
                            type="text"
                            value={newSkillInput}
                            onChange={(e) => setNewSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddSkillInput(category);
                              } else if (e.key === 'Escape') {
                                cancelAddSkill();
                              }
                            }}
                            placeholder="Enter skill name"
                            className="outline-none text-sm font-medium text-gray-900 flex-1 min-w-[150px]"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddSkillInput(category)}
                            className="p-1 text-green-600 hover:text-white hover:bg-green-500 rounded transition-all duration-200"
                            title="Add skill"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelAddSkill}
                            className="p-1 text-red-600 hover:text-white hover:bg-red-500 rounded transition-all duration-200"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startAddingSkill(category)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 mt-3"
                          title={`Add skill to ${categoryLabels[category]}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add More
                        </button>
                      )}
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Drag skills to reorder by priority. Higher priority skills appear first.
                      </p>
                    </>
                  )}
        </div>
              )}
        </div>
          );
        })}
      </div>

      {data.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong className="font-bold">Tip:</strong> Organize your skills by category and prioritize them using drag-and-drop. Higher priority skills will appear first in your resume.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillsForm;
