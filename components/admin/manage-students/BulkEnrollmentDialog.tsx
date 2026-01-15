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

const steps = ["Upload CSV", "Select Courses", "Confirm"];

export function BulkEnrollmentDialog({
  open,
  onClose,
  onSuccess,
}: BulkEnrollmentDialogProps) {
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [validationErrors, setValidationErrors] = useState<CSVValidationError[]>([]);
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
      showToast("Failed to load courses", "error");
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

    setParsedStudents(allStudents);
    setValidationErrors(allErrors);
    setStudentsPage(0);

    if (allStudents.length === 0) {
      showToast(
        `No valid students found in ${filesToParse.length} file(s). Please check ${totalErrors} error(s).`,
        "error"
      );
    } else if (allErrors.length > 0) {
      showToast(
        `Parsed ${totalValid} valid student(s) from ${filesToParse.length} file(s). ${totalErrors} row(s) skipped due to missing/invalid data.`,
        "warning"
      );
    } else {
      showToast(
        `Successfully parsed ${totalValid} students from ${filesToParse.length} file(s)`,
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
      showToast(`${invalidFiles.length} file(s) are not CSV files and were skipped`, "warning");
    }

    if (csvFiles.length === 0) {
      showToast("Please upload CSV files", "error");
      return;
    }

    // Add new files to existing files (avoid duplicates by name)
    setFiles(prevFiles => {
      const existingNames = new Set(prevFiles.map(f => f.name));
      const newFiles = csvFiles.filter(f => !existingNames.has(f.name));
      const allFiles = [...prevFiles, ...newFiles];
      
      if (newFiles.length < csvFiles.length) {
        showToast(`${csvFiles.length - newFiles.length} file(s) already uploaded`, "info");
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
        showToast("Please upload a CSV file with at least one valid student (name and email required)", "error");
        return;
      }
      // Allow proceeding even if some rows had errors (they're already skipped)
    } else if (activeStep === 1) {
      // Validate course selection
      if (selectedCourseIds.length === 0) {
        showToast("Please select at least one course", "error");
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
      showToast("Enrollment job created successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to create enrollment job", "error");
    } finally {
      setCreatingJob(false);
    }
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
              Upload Student CSV File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a CSV file with columns: name, email, phone (optional)
            </Typography>

            <Box
              sx={{
                border: "2px dashed #d1d5db",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                mb: 3,
                cursor: "pointer",
                "&:hover": {
                  borderColor: "#6366f1",
                  backgroundColor: "#f9fafb",
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
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CSV files only (multiple files supported)
              </Typography>
            </Box>

            {files.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Uploaded Files ({files.length}):
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
                            color: "#ef4444",
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {parsedStudents.length > 0 && validationErrors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Skipped Rows ({validationErrors.length}):
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  The following rows were skipped due to missing or invalid data. Only rows with both name and email are processed.
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 200, overflowY: "auto" }}>
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        Row {error.row}: {error.field} - {error.message}
                      </Typography>
                    </li>
                  ))}
                  {validationErrors.length > 20 && (
                    <Typography variant="body2" color="text.secondary">
                      ... and {validationErrors.length - 20} more skipped rows
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            {parsedStudents.length === 0 && validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  No Valid Students Found ({validationErrors.length} errors):
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  All rows were skipped. Please ensure your CSV has at least one row with both name and email fields.
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 200, overflowY: "auto" }}>
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        Row {error.row}: {error.field} - {error.message}
                      </Typography>
                    </li>
                  ))}
                  {validationErrors.length > 20 && (
                    <Typography variant="body2" color="text.secondary">
                      ... and {validationErrors.length - 20} more errors
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            {parsedStudents.length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Valid Students ({parsedStudents.length}):
                  </Typography>
                  {validationErrors.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {validationErrors.length} row(s) skipped
                    </Typography>
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
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
                            <TableCell>{student.phone || "-"}</TableCell>
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
                    labelRowsPerPage="Rows per page:"
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
              Select Courses
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select one or more courses to enroll students in
            </Typography>

            {loadingCourses ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Courses</InputLabel>
                <Select
                  multiple
                  value={selectedCourseIds}
                  onChange={(e) => setSelectedCourseIds(e.target.value as number[])}
                  label="Courses"
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
                  {selectedCourseIds.length} course(s) selected
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Confirm Enrollment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review the details before creating the enrollment job
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Students:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {parsedStudents.length}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Courses:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedCourseIds.length}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Total Enrollments:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {parsedStudents.length * selectedCourseIds.length}
                </Typography>
              </Box>
            </Paper>

            {validationErrors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Note: {validationErrors.length} row(s) from the CSV were skipped due to missing or invalid data (name/email required). Only the {parsedStudents.length} valid student(s) above will be processed.
                </Typography>
              </Alert>
            )}

            <Alert severity="info">
              This will create an asynchronous job. You can track the progress after
              submission.
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
              Bulk Student Enrollment
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
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={creatingJob}>
              Back
            </Button>
          )}
          {activeStep < 2 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={creatingJob}
              startIcon={<IconWrapper icon="mdi:arrow-right" size={20} />}
            >
              Next
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
              {creatingJob ? "Creating..." : "Create Job"}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
