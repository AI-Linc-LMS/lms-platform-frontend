"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  IconButton,
  TablePagination,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { parseStudentCSV, ParsedStudent, CSVValidationError } from "@/lib/utils/csv-parser";
import {
  adminStudentEnrollmentService,
  StudentEnrollmentJob,
} from "@/lib/services/admin/admin-student-enrollment.service";
import { coursesService } from "@/lib/services/courses.service";
import { Course } from "@/lib/services/courses.service";
import { EnrollmentJobStatus } from "./EnrollmentJobStatus";

interface BulkEnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkEnrollmentDialog({
  open,
  onClose,
  onSuccess,
}: BulkEnrollmentDialogProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const steps = [t("adminManageStudents.uploadCsv"), t("adminManageStudents.selectCourses"), t("adminManageStudents.confirm")];
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [validationErrors, setValidationErrors] = useState<CSVValidationError[]>([]);
  const [duplicateEmails, setDuplicateEmails] = useState<Array<{ email: string; count: number; students: ParsedStudent[] }>>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentsPage, setStudentsPage] = useState(0);
  const [studentsRowsPerPage, setStudentsRowsPerPage] = useState(10);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [currentJob, setCurrentJob] = useState<StudentEnrollmentJob | null>(null);
  const [showJobStatus, setShowJobStatus] = useState(false);

  // Load courses when dialog opens
  useEffect(() => {
    if (open) {
      loadCourses();
    } else {
      // Reset state when dialog closes
      setActiveStep(0);
      setFiles([]);
      setParsedStudents([]);
      setValidationErrors([]);
      setSelectedCourseIds([]);
      setCurrentJob(null);
      setShowJobStatus(false);
      setStudentsPage(0);
    }
  }, [open]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const coursesData = await coursesService.getCourses();
      setCourses(coursesData);
    } catch (error: any) {
      showToast(t("adminManageStudents.failedToLoadCourses"), "error");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleFileDelete = (indexToDelete: number) => {
    const newFiles = files.filter((_, index) => index !== indexToDelete);
    setFiles(newFiles);
    
    // Re-parse all remaining files
    if (newFiles.length === 0) {
      setParsedStudents([]);
      setValidationErrors([]);
      setDuplicateEmails([]);
      setStudentsPage(0);
      const fileInput = document.getElementById("csv-upload-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } else {
      parseAllFiles(newFiles);
    }
  };

  const parseAllFiles = async (filesToParse: File[]) => {
    const allStudents: ParsedStudent[] = [];
    const allErrors: CSVValidationError[] = [];
    let totalValid = 0;
    let totalErrors = 0;

    for (const file of filesToParse) {
      try {
        const text = await readFileAsText(file);
        const result = parseStudentCSV(text);
        
        // Add file name to errors for better tracking
        const errorsWithFileName = result.errors.map(error => ({
          ...error,
          message: `${file.name}: ${error.message}`,
        }));
        
        allStudents.push(...result.students);
        allErrors.push(...errorsWithFileName);
        totalValid += result.students.length;
        totalErrors += result.errors.length;
      } catch (error: any) {
        allErrors.push({
          row: 0,
          field: "file",
          message: `${file.name}: ${error.message || "Failed to parse file"}`,
        });
        totalErrors += 1;
      }
    }

    // Check for duplicate emails
    const emailMap = new Map<string, ParsedStudent[]>();
    allStudents.forEach((student) => {
      const email = student.email.toLowerCase().trim();
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(student);
    });

    const duplicates = Array.from(emailMap.entries())
      .filter(([_, students]) => students.length > 1)
      .map(([email, students]) => ({
        email,
        count: students.length,
        students,
      }));

    setParsedStudents(allStudents);
    setValidationErrors(allErrors);
    setDuplicateEmails(duplicates);
    setStudentsPage(0);

    if (duplicates.length > 0) {
      showToast(t("adminManageStudents.duplicateEmailsFound"), "error");
    } else if (allStudents.length === 0) {
      showToast(
        t("adminManageStudents.noValidStudentsInFiles", { count: filesToParse.length, errors: totalErrors }),
        "error"
      );
    } else if (allErrors.length > 0) {
      showToast(
        t("adminManageStudents.parsedWithErrors", { valid: totalValid, files: filesToParse.length, errors: totalErrors }),
        "warning"
      );
    } else {
      showToast(
        t("adminManageStudents.parsedSuccess", { count: totalValid, files: filesToParse.length }),
        "success"
      );
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    // Filter only CSV files
    const csvFiles = uploadedFiles.filter(file => file.name.endsWith(".csv"));
    const invalidFiles = uploadedFiles.filter(file => !file.name.endsWith(".csv"));

    if (invalidFiles.length > 0) {
      showToast(t("adminManageStudents.filesNotCsv", { count: invalidFiles.length }), "warning");
    }

    if (csvFiles.length === 0) {
      showToast(t("adminManageStudents.pleaseUploadCsv"), "error");
      return;
    }

    // Add new files to existing files (avoid duplicates by name)
    setFiles(prevFiles => {
      const existingNames = new Set(prevFiles.map(f => f.name));
      const newFiles = csvFiles.filter(f => !existingNames.has(f.name));
      const allFiles = [...prevFiles, ...newFiles];
      
      if (newFiles.length < csvFiles.length) {
        showToast(t("adminManageStudents.filesAlreadyUploaded", { count: csvFiles.length - newFiles.length }), "info");
      }
      
      // Parse all files
      parseAllFiles(allFiles);
      
      return allFiles;
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate CSV upload - only require at least one valid student
      if (parsedStudents.length === 0) {
        showToast(t("adminManageStudents.pleaseUploadCsvWithStudents"), "error");
        return;
      }
      // Check for duplicate emails
      if (duplicateEmails.length > 0) {
        showToast(t("adminManageStudents.duplicateEmailsRemove"), "error");
        return;
      }
      // Allow proceeding even if some rows had errors (they're already skipped)
    } else if (activeStep === 1) {
      // Validate course selection
      if (selectedCourseIds.length === 0) {
        showToast(t("adminManageStudents.pleaseSelectCourse"), "error");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCreateJob = async () => {
    try {
      setCreatingJob(true);
      const courseIdsString = selectedCourseIds.join(",");
      const job = await adminStudentEnrollmentService.createEnrollmentJob({
        students: parsedStudents,
        course_ids: courseIdsString,
      });

      setCurrentJob(job);
      setShowJobStatus(true);
      setActiveStep(3); // Move to job status step
      showToast(t("adminManageStudents.enrollmentJobCreated"), "success");
    } catch (error: any) {
      showToast(error.message || t("adminManageStudents.failedToCreateJob"), "error");
    } finally {
      setCreatingJob(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "name,email\nJohn Doe,john.doe@example.com\nJane Smith,jane.smith@example.com\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bulk_enrollment_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleJobComplete = () => {
    setShowJobStatus(false);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("adminManageStudents.uploadStudentCsvTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("adminManageStudents.uploadStudentCsvDesc")}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownloadSampleCsv}
                startIcon={<IconWrapper icon="mdi:download" size={18} />}
              >
                {t("adminManageStudents.downloadSampleCsv")}
              </Button>
            </Box>

            <Box
              sx={{
                border: "2px dashed var(--border-default)",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                mb: 3,
                cursor: "pointer",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  backgroundColor: "var(--surface)",
                },
              }}
              onClick={() => document.getElementById("csv-upload-input")?.click()}
            >
              <input
                id="csv-upload-input"
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <IconWrapper icon="mdi:upload" size={48} />
              <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                {t("adminManageStudents.clickToUpload")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("adminManageStudents.csvFilesOnly")}
              </Typography>
            </Box>

            {files.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t("adminManageStudents.uploadedFiles", { count: files.length })}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {files.map((file, index) => (
                    <Chip
                      key={`${file.name}-${index}`}
                      label={file.name}
                      onDelete={() => handleFileDelete(index)}
                      sx={{
                        "& .MuiChip-deleteIcon": {
                          cursor: "pointer",
                          "&:hover": {
                            color: "var(--error-500)",
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {duplicateEmails.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  {t("adminManageStudents.duplicateEmailsTitle", { count: duplicateEmails.length })}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("adminManageStudents.duplicateEmailsDesc")}
                </Typography>
                <Box sx={{ maxHeight: 300, overflowY: "auto", mt: 1.5 }}>
                  {duplicateEmails.slice(0, 20).map((duplicate, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        backgroundColor:
                          "color-mix(in srgb, var(--error-500) 12%, var(--surface) 88%)",
                        borderRadius: 1,
                        border: "1px solid color-mix(in srgb, var(--error-500) 35%, var(--border-default) 65%)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600, color: "var(--error-500)" }}>
                          {duplicate.email}
                        </Typography>
                        <Chip
                          label={`${duplicate.count} ${t("adminManageStudents.times")}`}
                          size="small"
                          sx={{
                            ml: 1,
                            height: 20,
                            fontSize: "0.7rem",
                            bgcolor:
                              "color-mix(in srgb, var(--error-500) 16%, var(--surface) 84%)",
                            color: "var(--error-500)",
                          }}
                        />
                      </Box>
                      <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                        {duplicate.students.map((student, studentIndex) => (
                          <li key={studentIndex}>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "0.8125rem", color: "var(--font-primary)" }}
                            >
                              {student.name} {student.phone ? `(${student.phone})` : ""}
                            </Typography>
                          </li>
                        ))}
                      </Box>
                    </Box>
                  ))}
                    {duplicateEmails.length > 20 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: "italic" }}>
                        {t("adminManageStudents.andMoreDuplicates", { count: duplicateEmails.length - 20 })}
                      </Typography>
                    )}
                </Box>
              </Alert>
            )}

            {parsedStudents.length > 0 && validationErrors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("adminManageStudents.skippedRowsTitle", { count: validationErrors.length })}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("adminManageStudents.skippedRowsDesc")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 200, overflowY: "auto" }}>
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {t("adminManageStudents.rowError", { row: error.row, field: error.field, message: error.message })}
                      </Typography>
                    </li>
                  ))}
                  {validationErrors.length > 20 && (
                    <Typography variant="body2" color="text.secondary">
                      {t("adminManageStudents.andMoreSkipped", { count: validationErrors.length - 20 })}
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            {parsedStudents.length === 0 && validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("adminManageStudents.noValidStudentsTitle", { count: validationErrors.length })}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("adminManageStudents.noValidStudentsDesc")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 200, overflowY: "auto" }}>
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {t("adminManageStudents.rowError", { row: error.row, field: error.field, message: error.message })}
                      </Typography>
                    </li>
                  ))}
                  {validationErrors.length > 20 && (
                    <Typography variant="body2" color="text.secondary">
                      {t("adminManageStudents.andMoreErrors", { count: validationErrors.length - 20 })}
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            {parsedStudents.length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {t("adminManageStudents.validStudents", { count: parsedStudents.length })}
                  </Typography>
                  {validationErrors.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {t("adminManageStudents.rowsSkipped", { count: validationErrors.length })}
                    </Typography>
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("adminManageStudents.name")}</TableCell>
                        <TableCell>{t("adminManageStudents.email")}</TableCell>
                        <TableCell>{t("adminManageStudents.phone")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedStudents
                        .slice(
                          studentsPage * studentsRowsPerPage,
                          studentsPage * studentsRowsPerPage + studentsRowsPerPage
                        )
                        .map((student, index) => (
                          <TableRow key={index}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{student.phone || t("adminManageStudents.na")}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={parsedStudents.length}
                    page={studentsPage}
                    onPageChange={(event, newPage) => {
                      setStudentsPage(newPage);
                    }}
                    rowsPerPage={studentsRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setStudentsRowsPerPage(parseInt(event.target.value, 10));
                      setStudentsPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    labelRowsPerPage={t("adminManageStudents.rowsPerPage")}
                  />
                </TableContainer>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("adminManageStudents.selectCoursesTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("adminManageStudents.selectCoursesDesc")}
            </Typography>

            {loadingCourses ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>{t("adminManageStudents.courses")}</InputLabel>
                <Select
                  multiple
                  value={selectedCourseIds}
                  onChange={(e) => setSelectedCourseIds(e.target.value as number[])}
                  label={t("adminManageStudents.courses")}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((courseId) => {
                        const course = courses.find((c) => c.id === courseId);
                        return (
                          <Chip
                            key={courseId}
                            label={course?.title || `Course ${courseId}`}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedCourseIds.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("adminManageStudents.courseSelected", { count: selectedCourseIds.length })}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("adminManageStudents.confirmEnrollmentTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("adminManageStudents.confirmEnrollmentDesc")}
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("adminManageStudents.students")}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {parsedStudents.length}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("adminManageStudents.courses")}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedCourseIds.length}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("adminManageStudents.totalEnrollments")}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {parsedStudents.length * selectedCourseIds.length}
                </Typography>
              </Box>
            </Paper>

            {validationErrors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {t("adminManageStudents.noteSkippedRows", { skipped: validationErrors.length, valid: parsedStudents.length })}
                </Typography>
              </Alert>
            )}

            <Alert severity="info">
              {t("adminManageStudents.asyncJobNote")}
            </Alert>
          </Box>
        );

      case 3:
        return showJobStatus && currentJob ? (
          <EnrollmentJobStatus
            taskId={currentJob.task_id}
            onComplete={handleJobComplete}
            onClose={onClose}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:account-plus" size={24} />
            <Typography variant="h6" fontWeight={600}>
              {t("adminManageStudents.bulkStudentEnrollment")}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {activeStep < 3 && (
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        {renderStepContent()}
      </DialogContent>
      {activeStep < 3 && (
        <DialogActions>
          <Button onClick={onClose} disabled={creatingJob}>
            {t("adminManageStudents.cancel")}
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={creatingJob}>
              {t("adminManageStudents.back")}
            </Button>
          )}
          {activeStep < 2 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={creatingJob}
              startIcon={<IconWrapper icon="mdi:arrow-right" size={20} />}
            >
              {t("adminManageStudents.next")}
            </Button>
          ) : (
            <Button
              onClick={handleCreateJob}
              variant="contained"
              disabled={creatingJob}
              startIcon={
                creatingJob ? (
                  <CircularProgress size={16} />
                ) : (
                  <IconWrapper icon="mdi:check" size={20} />
                )
              }
            >
              {creatingJob ? t("adminManageStudents.creating") : t("adminManageStudents.createJob")}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
