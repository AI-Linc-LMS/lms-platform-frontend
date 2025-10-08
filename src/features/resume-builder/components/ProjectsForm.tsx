import React, { useState } from "react";
import { Project } from "../types/resume";
import { v4 as uuidv4 } from "uuid";

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

const ProjectsForm: React.FC<ProjectsFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
        <button
          onClick={addProject}
          className="bg-[#257195] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1e5f7f] transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Project
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No projects added yet.</p>
          <p className="text-sm">Click "Add Project" to showcase your work.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((project, index) => (
            <div
              key={project.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                editingId === project.id
                  ? "ring-2 ring-[#257195] border-[#257195]"
                  : ""
              }`}
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
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) =>
                          updateProject(project.id, "name", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="E-commerce Website"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="month"
                          value={project.endDate}
                          onChange={(e) =>
                            updateProject(project.id, "endDate", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={project.link || ""}
                        onChange={(e) =>
                          updateProject(project.id, "link", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="https://github.com/username/project or https://project-demo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Technologies Used *
                      </label>
                      <input
                        type="text"
                        value={project.technologies.join(", ")}
                        onChange={(e) =>
                          updateTechnologies(project.id, e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="React, Node.js, MongoDB, Express.js"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate technologies with commas
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Description *
                      </label>
                      <textarea
                        value={project.description}
                        onChange={(e) =>
                          updateProject(
                            project.id,
                            "description",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent resize-none"
                        placeholder="• Built a full-stack e-commerce platform with user authentication and payment processing&#10;• Implemented responsive design ensuring optimal user experience across devices&#10;• Integrated Stripe API for secure payment processing&#10;• Deployed on AWS with CI/CD pipeline using GitHub Actions"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Describe what you built, technologies used, and key
                        achievements using bullet points.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
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
