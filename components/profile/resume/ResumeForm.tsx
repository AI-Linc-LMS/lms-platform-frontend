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
import type { Theme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import RichTextInput from "./RichTextInput";
import {
  ResumeData,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
} from "./types";

/**
 * The delete and minus buttons are `size="small"` with a 20px icon: a 30px square on desktop, and
 * that is what they stay there. Only below `sm` do they grow to a 44px target. The size lives in a
 * max-width query rather than `{ xs: 44, sm: ... }` so the desktop CSS carries no width at all and
 * cannot drift from the button's own.
 */
const PHONE_TAP = (theme: Theme) => ({
  [theme.breakpoints.down("sm")]: { width: 44, height: 44 },
});

interface ResumeFormProps {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
}

export function ResumeForm({ resumeData, setResumeData }: ResumeFormProps) {
  const [expanded, setExpanded] = useState<string>("basicInfo");


  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : "");
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

  const updateWorkExperience = (id: string, field: string, value: string | string[] | boolean) => {
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
    // Every pair of fields below carries `"& > *": { minWidth: 0 }`: a grid child defaults to
    // min-width:auto, so one field that will not shrink - a month picker, a URL with no spaces in
    // it - makes its column wider than the phone and takes the whole page sideways with it.
    <Box sx={{ minWidth: 0 }}>
      {/* Basic Information */}
      <Accordion
        expanded={expanded === "basicInfo"}
        onChange={handleAccordionChange("basicInfo")}
        sx={{
          mb: 2,
          border: "1px solid var(--border-default)",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary
          expandIcon={<IconWrapper icon="mdi:chevron-down" />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            px: { xs: 1.75, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:account" color="var(--accent-purple)" />
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
              Basic Information
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 1.75, sm: 2 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, "& > *": { minWidth: 0 } }}
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
              sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, "& > *": { minWidth: 0 } }}
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

            {/* Profile Photo / Logo - used by templates that support it (e.g. Western = photo, IIIT Vadodara = logo); stored as data URL so it appears in PDF */}
            <Box>
              <Typography sx={{ fontSize: "0.875rem", color: "var(--font-primary)", mb: 1 }}>
                Profile Photo / Logo
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {resumeData.basicInfo.photo ? (
                  <Avatar
                    src={resumeData.basicInfo.photo}
                    alt="Profile"
                    sx={{ width: 64, height: 64 }}
                  />
                ) : (
                  <Avatar sx={{ width: 64, height: 64, bgcolor: "var(--border-default)" }}>
                    <IconWrapper icon="mdi:account" color="var(--font-tertiary)" />
                  </Avatar>
                )}
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    startIcon={<IconWrapper icon="mdi:upload" size={20} />}
                    sx={{ textTransform: "none", minHeight: { xs: 44, sm: "auto" } }}
                  >
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          setResumeData({
                            ...resumeData,
                            basicInfo: {
                              ...resumeData.basicInfo,
                              photo: dataUrl,
                            },
                          });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                  {resumeData.basicInfo.photo && (
                    <Button
                      size="small"
                      onClick={() =>
                        setResumeData({
                          ...resumeData,
                          basicInfo: {
                            ...resumeData.basicInfo,
                            photo: "",
                          },
                        })
                      }
                      sx={{
                        textTransform: "none",
                        color: "var(--error-500)",
                        minHeight: { xs: 44, sm: "auto" },
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
              <Typography
                sx={{ fontSize: "0.75rem", color: "var(--font-secondary)", mt: 0.5 }}
              >
                Used as profile picture (e.g. Western) or logo (e.g. IIIT Vadodara). Stored so it appears in the PDF.
              </Typography>
            </Box>

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
                    sx={{
                      fontSize: "0.875rem",
                      color: "var(--font-secondary)",
                      mr: 0.5,
                      whiteSpace: "nowrap",
                    }}
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
                    sx={{
                      fontSize: "0.875rem",
                      color: "var(--font-secondary)",
                      mr: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    linkedin.com/in/
                  </Typography>
                ),
              }}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Portfolio Website"
                value={resumeData.basicInfo.portfolio || ""}
                onChange={(e) => updateBasicInfo("portfolio", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://myportfolio.com"
              />
              <TextField
                label="LeetCode Profile"
                value={resumeData.basicInfo.leetcode || ""}
                onChange={(e) => updateBasicInfo("leetcode", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://leetcode.com/u/username"
              />
              <TextField
                label="HackerRank Profile"
                value={resumeData.basicInfo.hackerrank || ""}
                onChange={(e) => updateBasicInfo("hackerrank", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://hackerrank.com/username"
              />
              <TextField
                label="Kaggle Profile"
                value={resumeData.basicInfo.kaggle || ""}
                onChange={(e) => updateBasicInfo("kaggle", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://kaggle.com/username"
              />
              <TextField
                label="Medium Profile"
                value={resumeData.basicInfo.medium || ""}
                onChange={(e) => updateBasicInfo("medium", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://medium.com/@username"
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.75 }}>
                Professional Summary
              </Typography>
              <RichTextInput
                value={resumeData.basicInfo.summary}
                onChange={(value) => updateBasicInfo("summary", value)}
                minRows={4}
                placeholder="Brief overview of your professional background and key achievements"
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Work Experience */}
      <Accordion
        expanded={expanded === "workExperience"}
        onChange={handleAccordionChange("workExperience")}
        sx={{
          mb: 2,
          border: "1px solid var(--border-default)",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary
          expandIcon={<IconWrapper icon="mdi:chevron-down" />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            px: { xs: 1.75, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:briefcase" color="var(--accent-purple)" />
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
              Work Experience ({resumeData.workExperience.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 1.75, sm: 2 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.workExperience.map((exp, index) => (
              <Paper
                key={exp.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid var(--border-default)", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                    Experience #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeWorkExperience(exp.id)}
                    sx={[{ color: "var(--error-500)" }, PHONE_TAP]}
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
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      "& > *": { minWidth: 0 },
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
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      "& > *": { minWidth: 0 },
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
                      <RichTextInput
                        value={desc}
                        onChange={(value) =>
                          updateDescriptionPoint(exp.id, descIndex, value)
                        }
                        placeholder="Achievement or responsibility"
                        actions={
                          <IconButton
                            size="small"
                            onClick={() =>
                              removeDescriptionPoint(exp.id, descIndex)
                            }
                            sx={[{ color: "var(--error-500)", ml: "auto" }, PHONE_TAP]}
                          >
                            <IconWrapper icon="mdi:minus" size={20} />
                          </IconButton>
                        }
                      />
                    </Box>
                  ))}

                  <Button
                    startIcon={<IconWrapper icon="mdi:plus" />}
                    onClick={() => addDescriptionPoint(exp.id)}
                    size="small"
                    sx={{
                      alignSelf: { xs: "stretch", sm: "flex-start" },
                      textTransform: "none",
                      minHeight: { xs: 44, sm: "auto" },
                    }}
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
                borderColor: "var(--accent-purple)",
                color: "var(--accent-purple)",
                minHeight: { xs: 48, sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
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
          border: "1px solid var(--border-default)",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary
          expandIcon={<IconWrapper icon="mdi:chevron-down" />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            px: { xs: 1.75, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:school" color="var(--accent-purple)" />
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
              Education ({resumeData.education.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 1.75, sm: 2 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.education.map((edu, index) => (
              <Paper
                key={edu.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid var(--border-default)", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                    Education #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeEducation(edu.id)}
                    sx={[{ color: "var(--error-500)" }, PHONE_TAP]}
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
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      "& > *": { minWidth: 0 },
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
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                      "& > *": { minWidth: 0 },
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

                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.75 }}>
                      Description (optional)
                    </Typography>
                    <RichTextInput
                      value={edu.description}
                      onChange={(value) =>
                        updateEducation(edu.id, "description", value)
                      }
                      minRows={2}
                    />
                  </Box>
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
                borderColor: "var(--accent-purple)",
                color: "var(--accent-purple)",
                minHeight: { xs: 48, sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
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
          border: "1px solid var(--border-default)",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary
          expandIcon={<IconWrapper icon="mdi:chevron-down" />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            px: { xs: 1.75, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:chart-box" color="var(--accent-purple)" />
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
              Skills ({resumeData.skills.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 1.75, sm: 2 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {resumeData.skills.map((skill) => (
              /* Name, a 120px level box and a delete button in one row is 300px of controls in
                 290px of phone. The name takes its own row there, and level and delete share the
                 next; above `sm` it is the single row it always was. */
              <Box
                key={skill.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr auto", sm: "1fr 120px auto" },
                  gap: { xs: 1.5, sm: 2 },
                  alignItems: "center",
                  "& > *": { minWidth: 0 },
                }}
              >
                <TextField
                  label="Skill Name"
                  value={skill.name}
                  onChange={(e) =>
                    updateSkill(skill.id, "name", e.target.value)
                  }
                  fullWidth
                  size="small"
                  sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
                />
                <TextField
                  label="Level (1-5)"
                  type="number"
                  value={skill.level}
                  onChange={(e) =>
                    updateSkill(skill.id, "level", Number(e.target.value))
                  }
                  inputProps={{ min: 1, max: 5 }}
                  sx={{ width: { xs: "100%", sm: 120 } }}
                  size="small"
                />
                <IconButton
                  size="small"
                  onClick={() => removeSkill(skill.id)}
                  sx={[{ color: "var(--error-500)" }, PHONE_TAP]}
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
                borderColor: "var(--accent-purple)",
                color: "var(--accent-purple)",
                minHeight: { xs: 48, sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
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
          border: "1px solid var(--border-default)",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary
          expandIcon={<IconWrapper icon="mdi:chevron-down" />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            px: { xs: 1.75, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:code-braces" color="var(--accent-purple)" />
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
              Projects ({resumeData.projects.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 1.75, sm: 2 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.projects.map((project, index) => (
              <Paper
                key={project.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid var(--border-default)", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                    Project #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeProject(project.id)}
                    sx={[{ color: "var(--error-500)" }, PHONE_TAP]}
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

                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.75 }}>
                      Description
                    </Typography>
                    <RichTextInput
                      value={project.description}
                      onChange={(value) =>
                        updateProject(project.id, "description", value)
                      }
                      minRows={3}
                    />
                  </Box>

                  <TextField
                    label="Technologies (comma-separated)"
                    /* The field is a round trip: value = join(", "), onChange = split(",").
                       It used to .trim() every segment on the way IN, which meant the space the
                       learner had just typed was deleted before it could be re-rendered --
                       "Market" + space came back as "Market", so a multi-word entry like
                       "Market Sizing" was literally impossible to type. Commas are the
                       separator, so only they may split; spaces are content.

                       Trimming happens on BLUR instead, where it tidies without fighting the
                       cursor. Empty segments survive editing too, or deleting back past a comma
                       would collapse the entry you were still working on. */
                    value={project.technologies.join(", ")}
                    onChange={(e) =>
                      updateProject(
                        project.id,
                        "technologies",
                        e.target.value.split(",").map((t) => t.replace(/^ +/, ""))
                      )
                    }
                    onBlur={(e) =>
                      updateProject(
                        project.id,
                        "technologies",
                        e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
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
                borderColor: "var(--accent-purple)",
                color: "var(--accent-purple)",
                minHeight: { xs: 48, sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
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
          border: "1px solid var(--border-default)",
          borderRadius: "8px !important",
        }}
      >
        <AccordionSummary
          expandIcon={<IconWrapper icon="mdi:chevron-down" />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            px: { xs: 1.75, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:certificate" color="var(--accent-purple)" />
            <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: { xs: "0.95rem", sm: "1rem" } }}>
              Certifications ({resumeData.certifications.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 1.75, sm: 2 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {resumeData.certifications.map((cert) => (
              <Paper
                key={cert.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid var(--border-default)", borderRadius: 2 }}
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
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        "& > *": { minWidth: 0 },
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
                    sx={[{ color: "var(--error-500)" }, PHONE_TAP]}
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
                borderColor: "var(--accent-purple)",
                color: "var(--accent-purple)",
                minHeight: { xs: 48, sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
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
