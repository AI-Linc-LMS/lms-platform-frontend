import React, { useState } from "react";
import { Project } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";
import RichTextEditor from "./RichTextEditor";

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

const ProjectsForm: React.FC<ProjectsFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSampleData = () => {
    const sampleData: Project[] = [
      {
        id: uuidv4(),
        name: "E-Commerce Platform",
        description:
          "• Built a full-stack e-commerce platform with user authentication and payment processing\n• Implemented responsive design ensuring optimal user experience across all devices\n• Integrated Stripe API for secure payment processing with real-time order tracking\n• Deployed on AWS with CI/CD pipeline using GitHub Actions\n• Achieved 99.9% uptime and processed 10,000+ orders in first month",
        technologies: ["React", "Node.js", "MongoDB", "Express.js", "Stripe API", "AWS"],
        link: "https://github.com/username/ecommerce-platform",
        startDate: "2023-01",
        endDate: "2023-06",
      },
      {
        id: uuidv4(),
        name: "Task Management App",
        description:
          "• Developed a collaborative task management application with real-time updates\n• Implemented drag-and-drop functionality for task organization\n• Built RESTful API backend with JWT authentication\n• Used WebSockets for real-time collaboration features\n• Achieved 50% reduction in team task completion time",
        technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Socket.io"],
        link: "https://taskapp-demo.vercel.app",
        startDate: "2022-08",
        endDate: "2022-12",
      },
      {
        id: uuidv4(),
        name: "Machine Learning Price Predictor",
        description:
          "• Created a machine learning model to predict real estate prices using Python\n• Scraped and cleaned dataset of 50,000+ property listings\n• Achieved 85% prediction accuracy using Random Forest algorithm\n• Built interactive web dashboard for visualizing predictions\n• Presented findings to local real estate professionals",
        technologies: ["Python", "Scikit-learn", "Pandas", "Flask", "D3.js"],
        link: "https://github.com/username/ml-price-predictor",
        startDate: "2022-03",
        endDate: "2022-07",
      },
    ];
    onChange(sampleData);
  };

  const addProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: "",
      description: "",
      technologies: [],
      link: "",
      startDate: "",
      endDate: "",
    };
    onChange([...data, newProject]);
    setEditingId(newProject.id);
    // Scroll to the newly added project after a short delay
    setTimeout(() => {
      const element = document.getElementById(`project-${newProject.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a highlight animation
        element.classList.add("animate-pulse");
        setTimeout(() => {
          element.classList.remove("animate-pulse");
        }, 2000);
      }
    }, 100);
  };

  const updateProject = (
    id: string,
    field: keyof Project,
    value: string | string[]
  ) => {
    onChange(
      data.map((project) =>
        project.id === id ? { ...project, [field]: value } : project
      )
    );
  };

  const deleteProject = (id: string) => {
    onChange(data.filter((project) => project.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveProject = (id: string, direction: "up" | "down") => {
    const index = data.findIndex((project) => project.id === id);
    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < data.length - 1)
    ) {
      const newData = [...data];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newData[index], newData[targetIndex]] = [
        newData[targetIndex],
        newData[index],
      ];
      onChange(newData);
    }
  };

  const updateTechnologies = (id: string, techString: string) => {
    const technologies = techString
      .split(",")
      .map((tech) => tech.trim())
      .filter((tech) => tech.length > 0);
    updateProject(id, "technologies", technologies);
  };

  return (
    <div className="space-y-4">
      <FormHeader
        title="Projects"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
      />

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No projects added yet.</p>
          <p className="text-sm text-gray-500 mb-6">Click "Add Project" to showcase your work.</p>
          <button
            onClick={addProject}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((project, index) => (
            <div
              key={project.id}
              id={`project-${project.id}`}
              className={`border-2 rounded-xl p-5 transition-all duration-300 animate-fade-in ${
                editingId === project.id
                  ? "ring-2 ring-blue-500 border-blue-500 shadow-lg bg-blue-50/30 scale-[1.01]"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white hover:scale-[1.005]"
              }`}
              style={{
                animation: "fadeIn 0.3s ease-in",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {project.name || "Untitled Project"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {project.startDate} - {project.endDate}
                    {project.link && (
                      <span className="ml-2">
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          🔗 View Project
                        </a>
                      </span>
                    )}
                  </p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveProject(project.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveProject(project.id, "down")}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingId(editingId === project.id ? null : project.id)
                    }
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingId === project.id && (
                <div className="space-y-6 border-t-2 border-gray-200 pt-6 mt-6">
                  {/* Project Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Project Details
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) =>
                          updateProject(project.id, "name", e.target.value)
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        placeholder="E-commerce Website"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        A clear, descriptive name for your project
                      </p>
                    </div>
                  </div>

                  {/* Technologies */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Technologies & Stack
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Technologies Used *
                      </label>
                      <input
                        type="text"
                        value={project.technologies.join(", ")}
                        onChange={(e) =>
                          updateTechnologies(project.id, e.target.value)
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        placeholder="React, Node.js, MongoDB, Express.js, AWS"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate technologies with commas. Include programming
                        languages, frameworks, libraries, and tools.
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Project Timeline
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="month"
                          value={project.startDate}
                          onChange={(e) =>
                            updateProject(
                              project.id,
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="month"
                          value={project.endDate}
                          onChange={(e) =>
                            updateProject(project.id, "endDate", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Leave empty if project is ongoing
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Project Links
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={project.link || ""}
                        onChange={(e) =>
                          updateProject(project.id, "link", e.target.value)
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        placeholder="https://github.com/username/project or https://project-demo.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Link to GitHub repository, live demo, or deployed
                        application
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Project Description
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description & Achievements *
                      </label>
                      <RichTextEditor
                        value={project.description}
                        onChange={(html) =>
                          updateProject(
                            project.id,
                            "description",
                            html
                          )
                        }
                        placeholder="• Built a full-stack e-commerce platform with user authentication and payment processing&#10;• Implemented responsive design ensuring optimal user experience across all devices&#10;• Integrated Stripe API for secure payment processing with real-time order tracking&#10;• Deployed on AWS with CI/CD pipeline using GitHub Actions&#10;• Achieved 99.9% uptime and processed 10,000+ orders in first month"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Use the toolbar to format text with bold, italic, underline, bullet points, and numbered lists.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            💡 <strong>Tip:</strong> Focus on projects that demonstrate skills
            relevant to the jobs you're applying for. Include metrics and
            outcomes when possible.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsForm;
