"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  Avatar,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ResumeData,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
} from "./types";

interface ResumeFormProps {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
}

export function ResumeForm({ resumeData, setResumeData }: ResumeFormProps) {
  const [expanded, setExpanded] = useState<string>("basicInfo");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [sectionOrder, setSectionOrder] = useState([
    "basicInfo",
    "workExperience",
    "education",
    "skills",
    "projects",
    "certifications",
  ]);

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : "");
    };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sectionOrder];
    const draggedSection = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedSection);

    setDraggedIndex(index);
    setSectionOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Basic Info Handlers
  const updateBasicInfo = (field: string, value: string) => {
    setResumeData({
      ...resumeData,
      basicInfo: { ...resumeData.basicInfo, [field]: value },
    });
  };

  // Work Experience Handlers
  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      position: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: [""],
    };
    setResumeData({
      ...resumeData,
      workExperience: [...resumeData.workExperience, newExp],
    });
  };

  const updateWorkExperience = (id: string, field: string, value: any) => {
    setResumeData({
      ...resumeData,
      workExperience: resumeData.workExperience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeWorkExperience = (id: string) => {
    setResumeData({
      ...resumeData,
      workExperience: resumeData.workExperience.filter((exp) => exp.id !== id),
    });
  };

  const addDescriptionPoint = (id: string) => {
    setResumeData({
      ...resumeData,
      workExperience: resumeData.workExperience.map((exp) =>
        exp.id === id ? { ...exp, description: [...exp.description, ""] } : exp
      ),
    });
  };

  const updateDescriptionPoint = (id: string, index: number, value: string) => {
    setResumeData({
      ...resumeData,
      workExperience: resumeData.workExperience.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              description: exp.description.map((desc, i) =>
                i === index ? value : desc
              ),
            }
          : exp
      ),
    });
  };

  const removeDescriptionPoint = (id: string, index: number) => {
    setResumeData({
      ...resumeData,
      workExperience: resumeData.workExperience.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              description: exp.description.filter((_, i) => i !== index),
            }
          : exp
      ),
    });
  };

  // Education Handlers
  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    };
    setResumeData({
      ...resumeData,
      education: [...resumeData.education, newEdu],
    });
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData({
      ...resumeData,
      education: resumeData.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    setResumeData({
      ...resumeData,
      education: resumeData.education.filter((edu) => edu.id !== id),
    });
  };

  // Skills Handlers
  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: "",
      level: 3,
    };
    setResumeData({
      ...resumeData,
      skills: [...resumeData.skills, newSkill],
    });
  };

  const updateSkill = (id: string, field: string, value: string | number) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    });
  };

  const removeSkill = (id: string) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((skill) => skill.id !== id),
    });
  };

  // Projects Handlers
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: "",
      description: "",
      technologies: [],
      link: "",
    };
    setResumeData({
      ...resumeData,
      projects: [...resumeData.projects, newProject],
    });
  };

  const updateProject = (
    id: string,
    field: string,
    value: string | string[]
  ) => {
    setResumeData({
      ...resumeData,
      projects: resumeData.projects.map((project) =>
        project.id === id ? { ...project, [field]: value } : project
      ),
    });
  };

  const removeProject = (id: string) => {
    setResumeData({
      ...resumeData,
      projects: resumeData.projects.filter((project) => project.id !== id),
    });
  };

  // Certifications Handlers
  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: "",
      issuer: "",
      date: "",
      link: "",
    };
    setResumeData({
      ...resumeData,
      certifications: [...resumeData.certifications, newCert],
    });
  };

  const updateCertification = (id: string, field: string, value: string) => {
    setResumeData({
      ...resumeData,
      certifications: resumeData.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    });
  };

  const removeCertification = (id: string) => {
    setResumeData({
      ...resumeData,
      certifications: resumeData.certifications.filter(
        (cert) => cert.id !== id
      ),
    });
  };

  return (
    <Box>
      {/* Basic Information */}
      <Accordion
        expanded={expanded === "basicInfo"}
        onChange={handleAccordionChange("basicInfo")}
        sx={{
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:account" color="#6366f1" />
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              Basic Information
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="First Name"
                value={resumeData.basicInfo.firstName}
                onChange={(e) => updateBasicInfo("firstName", e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Last Name"
                value={resumeData.basicInfo.lastName}
                onChange={(e) => updateBasicInfo("lastName", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Professional Title"
              value={resumeData.basicInfo.professionalTitle}
              onChange={(e) =>
                updateBasicInfo("professionalTitle", e.target.value)
              }
              fullWidth
              size="small"
              placeholder="e.g., Senior Software Engineer"
            />

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="Email"
                type="email"
                value={resumeData.basicInfo.email}
                onChange={(e) => updateBasicInfo("email", e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Phone"
                value={resumeData.basicInfo.phone}
                onChange={(e) => updateBasicInfo("phone", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Location"
              value={resumeData.basicInfo.location}
              onChange={(e) => updateBasicInfo("location", e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g., San Francisco, CA"
            />

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="GitHub Username"
                value={resumeData.basicInfo.github || ""}
                onChange={(e) => updateBasicInfo("github", e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g., johndoe"
                InputProps={{
                  startAdornment: (
                    <Typography
                      sx={{ fontSize: "0.875rem", color: "#666", mr: 0.5 }}
                    >
                      github.com/
                    </Typography>
                  ),
                }}
              />

              <TextField
                label="LinkedIn Username"
                value={resumeData.basicInfo.linkedin || ""}
                onChange={(e) => updateBasicInfo("linkedin", e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g., johndoe"
                InputProps={{
                  startAdornment: (
                    <Typography
                      sx={{ fontSize: "0.875rem", color: "#666", mr: 0.5 }}
                    >
                      linkedin.com/in/
                    </Typography>
                  ),
                }}
              />
            </Box>

            <TextField
              label="Professional Summary"
              value={resumeData.basicInfo.summary}
              onChange={(e) => updateBasicInfo("summary", e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Brief overview of your professional background and key achievements"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Work Experience */}
      <Accordion
        expanded={expanded === "workExperience"}
        onChange={handleAccordionChange("workExperience")}
        sx={{
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:briefcase" color="#6366f1" />
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              Work Experience ({resumeData.workExperience.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.workExperience.map((exp, index) => (
              <Paper
                key={exp.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
                    Experience #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeWorkExperience(exp.id)}
                    sx={{ color: "#ef4444" }}
                  >
                    <IconWrapper icon="mdi:delete" size={20} />
                  </IconButton>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Position"
                    value={exp.position}
                    onChange={(e) =>
                      updateWorkExperience(exp.id, "position", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Company"
                      value={exp.company}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "company", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Location"
                      value={exp.location}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "location", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Start Date"
                      type="month"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateWorkExperience(
                          exp.id,
                          "startDate",
                          e.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Date"
                      type="month"
                      value={exp.endDate}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "endDate", e.target.value)
                      }
                      fullWidth
                      size="small"
                      disabled={exp.current}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exp.current}
                        onChange={(e) =>
                          updateWorkExperience(
                            exp.id,
                            "current",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="I currently work here"
                  />

                  <Divider />

                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Job Description
                  </Typography>

                  {exp.description.map((desc, descIndex) => (
                    <Box key={descIndex} sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={desc}
                        onChange={(e) =>
                          updateDescriptionPoint(
                            exp.id,
                            descIndex,
                            e.target.value
                          )
                        }
                        placeholder="Achievement or responsibility"
                        multiline
                      />
                      <IconButton
                        size="small"
                        onClick={() =>
                          removeDescriptionPoint(exp.id, descIndex)
                        }
                        sx={{ color: "#ef4444" }}
                      >
                        <IconWrapper icon="mdi:minus" size={20} />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    startIcon={<IconWrapper icon="mdi:plus" />}
                    onClick={() => addDescriptionPoint(exp.id)}
                    size="small"
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    Add Description Point
                  </Button>
                </Box>
              </Paper>
            ))}

            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:plus" />}
              onClick={addWorkExperience}
              sx={{
                textTransform: "none",
                borderStyle: "dashed",
                borderColor: "#6366f1",
                color: "#6366f1",
              }}
            >
              Add Work Experience
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Education */}
      <Accordion
        expanded={expanded === "education"}
        onChange={handleAccordionChange("education")}
        sx={{
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:school" color="#6366f1" />
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              Education ({resumeData.education.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.education.map((edu, index) => (
              <Paper
                key={edu.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
                    Education #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeEducation(edu.id)}
                    sx={{ color: "#ef4444" }}
                  >
                    <IconWrapper icon="mdi:delete" size={20} />
                  </IconButton>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Degree"
                    value={edu.degree}
                    onChange={(e) =>
                      updateEducation(edu.id, "degree", e.target.value)
                    }
                    fullWidth
                    size="small"
                    placeholder="e.g., Bachelor of Science in Computer Science"
                  />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Institution"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(edu.id, "institution", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Location"
                      value={edu.location}
                      onChange={(e) =>
                        updateEducation(edu.id, "location", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Start Date"
                      type="month"
                      value={edu.startDate}
                      onChange={(e) =>
                        updateEducation(edu.id, "startDate", e.target.value)
                      }
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Date"
                      type="month"
                      value={edu.endDate}
                      onChange={(e) =>
                        updateEducation(edu.id, "endDate", e.target.value)
                      }
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="GPA (optional)"
                      value={edu.gpa}
                      onChange={(e) =>
                        updateEducation(edu.id, "gpa", e.target.value)
                      }
                      fullWidth
                      size="small"
                      placeholder="e.g., 3.8/4.0"
                    />
                  </Box>

                  <TextField
                    label="Description (optional)"
                    value={edu.description}
                    onChange={(e) =>
                      updateEducation(edu.id, "description", e.target.value)
                    }
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Box>
              </Paper>
            ))}

            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:plus" />}
              onClick={addEducation}
              sx={{
                textTransform: "none",
                borderStyle: "dashed",
                borderColor: "#6366f1",
                color: "#6366f1",
              }}
            >
              Add Education
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Skills */}
      <Accordion
        expanded={expanded === "skills"}
        onChange={handleAccordionChange("skills")}
        sx={{
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:chart-box" color="#6366f1" />
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              Skills ({resumeData.skills.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {resumeData.skills.map((skill) => (
              <Box
                key={skill.id}
                sx={{ display: "flex", gap: 2, alignItems: "center" }}
              >
                <TextField
                  label="Skill Name"
                  value={skill.name}
                  onChange={(e) =>
                    updateSkill(skill.id, "name", e.target.value)
                  }
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Level (1-5)"
                  type="number"
                  value={skill.level}
                  onChange={(e) =>
                    updateSkill(skill.id, "level", Number(e.target.value))
                  }
                  inputProps={{ min: 1, max: 5 }}
                  sx={{ width: 120 }}
                  size="small"
                />
                <IconButton
                  size="small"
                  onClick={() => removeSkill(skill.id)}
                  sx={{ color: "#ef4444" }}
                >
                  <IconWrapper icon="mdi:delete" size={20} />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:plus" />}
              onClick={addSkill}
              sx={{
                textTransform: "none",
                borderStyle: "dashed",
                borderColor: "#6366f1",
                color: "#6366f1",
              }}
            >
              Add Skill
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Projects */}
      <Accordion
        expanded={expanded === "projects"}
        onChange={handleAccordionChange("projects")}
        sx={{
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:code-braces" color="#6366f1" />
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              Projects ({resumeData.projects.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.projects.map((project, index) => (
              <Paper
                key={project.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
                    Project #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeProject(project.id)}
                    sx={{ color: "#ef4444" }}
                  >
                    <IconWrapper icon="mdi:delete" size={20} />
                  </IconButton>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Project Name"
                    value={project.name}
                    onChange={(e) =>
                      updateProject(project.id, "name", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />

                  <TextField
                    label="Description"
                    value={project.description}
                    onChange={(e) =>
                      updateProject(project.id, "description", e.target.value)
                    }
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />

                  <TextField
                    label="Technologies (comma-separated)"
                    value={project.technologies.join(", ")}
                    onChange={(e) =>
                      updateProject(
                        project.id,
                        "technologies",
                        e.target.value.split(",").map((t) => t.trim())
                      )
                    }
                    fullWidth
                    size="small"
                    placeholder="e.g., React, Node.js, MongoDB"
                  />

                  <TextField
                    label="Project Link (optional)"
                    value={project.link}
                    onChange={(e) =>
                      updateProject(project.id, "link", e.target.value)
                    }
                    fullWidth
                    size="small"
                    placeholder="e.g., https://github.com/username/project"
                  />
                </Box>
              </Paper>
            ))}

            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:plus" />}
              onClick={addProject}
              sx={{
                textTransform: "none",
                borderStyle: "dashed",
                borderColor: "#6366f1",
                color: "#6366f1",
              }}
            >
              Add Project
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Certifications */}
      <Accordion
        expanded={expanded === "certifications"}
        onChange={handleAccordionChange("certifications")}
        sx={{
          mb: 2,
          border: "1px solid #e5e7eb",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:certificate" color="#6366f1" />
            <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>
              Certifications ({resumeData.certifications.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {resumeData.certifications.map((cert) => (
              <Paper
                key={cert.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Certification Name"
                      value={cert.name}
                      onChange={(e) =>
                        updateCertification(cert.id, "name", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="Issuer"
                        value={cert.issuer}
                        onChange={(e) =>
                          updateCertification(cert.id, "issuer", e.target.value)
                        }
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Date"
                        type="month"
                        value={cert.date}
                        onChange={(e) =>
                          updateCertification(cert.id, "date", e.target.value)
                        }
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <TextField
                      label="Link (optional)"
                      value={cert.link}
                      onChange={(e) =>
                        updateCertification(cert.id, "link", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => removeCertification(cert.id)}
                    sx={{ color: "#ef4444" }}
                  >
                    <IconWrapper icon="mdi:delete" size={20} />
                  </IconButton>
                </Box>
              </Paper>
            ))}

            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:plus" />}
              onClick={addCertification}
              sx={{
                textTransform: "none",
                borderStyle: "dashed",
                borderColor: "#6366f1",
                color: "#6366f1",
              }}
            >
              Add Certification
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
