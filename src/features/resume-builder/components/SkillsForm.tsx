import React, { useState } from "react";
import { Skill } from "../types/resume";
import { v4 as uuidv4 } from "uuid";

interface SkillsFormProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

const SkillsForm: React.FC<SkillsFormProps> = ({ data, onChange }) => {
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] =
    useState<Skill["level"]>("Intermediate");

  const addSkill = () => {
    if (newSkillName.trim()) {
      const newSkill: Skill = {
        id: uuidv4(),
        name: newSkillName.trim(),
        level: newSkillLevel,
      };
      onChange([...data, newSkill]);
      setNewSkillName("");
      setNewSkillLevel("Intermediate");
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

  const skillLevels: Skill["level"][] = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
  ];

  const getSkillLevelColor = (level: Skill["level"]) => {
    switch (level) {
      case "Beginner":
        return "bg-red-100 text-red-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-blue-100 text-blue-800";
      case "Expert":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addSkill();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Skills</h3>

      {/* Add New Skill */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-3">Add New Skill</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
            placeholder="e.g., JavaScript, React, Python..."
          />
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as Skill["level"])}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
          >
            {skillLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <button
            onClick={addSkill}
            disabled={!newSkillName.trim()}
            className="bg-[#257195] text-white px-4 py-2 rounded-lg hover:bg-[#1e5f7f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Skills List */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No skills added yet.</p>
          <p className="text-sm">Add your technical and soft skills above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">
            Your Skills ({data.length})
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {data.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) =>
                      updateSkill(skill.id, "name", e.target.value)
                    }
                    className="flex-1 border-none outline-none font-medium text-gray-800 bg-transparent"
                  />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(
                      skill.level
                    )}`}
                  >
                    {skill.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={skill.level}
                    onChange={(e) =>
                      updateSkill(skill.id, "level", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#257195] focus:border-transparent"
                  >
                    {skillLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Delete skill"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Suggestions */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-3">
          Quick Add Popular Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            "JavaScript",
            "Python",
            "React",
            "Node.js",
            "HTML/CSS",
            "SQL",
            "Git",
            "TypeScript",
            "Java",
            "AWS",
            "Docker",
            "MongoDB",
            "Express.js",
            "Vue.js",
            "Communication",
            "Leadership",
            "Problem Solving",
            "Team Collaboration",
          ].map((skillName) => (
            <button
              key={skillName}
              onClick={() => {
                if (
                  !data.some(
                    (skill) =>
                      skill.name.toLowerCase() === skillName.toLowerCase()
                  )
                ) {
                  const newSkill: Skill = {
                    id: uuidv4(),
                    name: skillName,
                    level: "Intermediate",
                  };
                  onChange([...data, newSkill]);
                }
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-[#257195] hover:text-[#257195] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={data.some(
                (skill) => skill.name.toLowerCase() === skillName.toLowerCase()
              )}
            >
              {data.some(
                (skill) => skill.name.toLowerCase() === skillName.toLowerCase()
              )
                ? "✓ "
                : "+ "}
              {skillName}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Click to add popular skills. You can edit the proficiency level after
          adding.
        </p>
      </div>

      {data.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Include both technical skills (programming
            languages, tools) and soft skills (communication, leadership) that
            are relevant to your target job.
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillsForm;
