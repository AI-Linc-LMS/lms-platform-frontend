import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Description as DocxIcon,
  Slideshow as PptIcon,
} from "@mui/icons-material";
import { Ebook } from "../types";
import { extractBookContent } from "../utils/fileReader";
import { downloadPPT, downloadDOCX, downloadPDF } from "../utils/mockDownload";

const EbookProcessingPage = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem("ebook-processing-books");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((ebook: any) => ({
          ...ebook,
          uploadDate: new Date(ebook.uploadDate),
        }));
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingBookId, setProcessingBookId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage whenever ebooks change
  useEffect(() => {
    try {
      localStorage.setItem("ebook-processing-books", JSON.stringify(ebooks));
    } catch {
      // Ignore storage errors
    }
  }, [ebooks]);

  const validateFile = (file: File): string | null => {
    const validTypes = [".pdf", ".epub", ".mobi", ".txt"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!validTypes.includes(fileExtension)) {
      return `Invalid file type. Please upload: ${validTypes.join(", ")}`;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return "File size exceeds 100MB limit";
    }

    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const newEbook: Ebook = {
      id: `ebook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      status: "processing",
      formats: {
        ppt: false,
        docx: false,
        pdf: false,
      },
    };

    // Add to list immediately
    setEbooks((prev) => [...prev, newEbook]);
    setProcessingBookId(newEbook.id);
    setIsProcessing(true);

    try {
      // Extract content from the book
      const extractedContent = await extractBookContent(file);

      // Simulate processing time (2-3 seconds)
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 1000)
      );

      // Update ebook with extracted content and mark as ready
      setEbooks((prev) =>
        prev.map((ebook) =>
          ebook.id === newEbook.id
            ? {
                ...ebook,
                status: "ready",
                formats: {
                  ppt: true,
                  docx: true,
                  pdf: true,
                },
                extractedContent,
              }
            : ebook
        )
      );

      setSuccessMessage(`Successfully processed "${file.name}"`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        `Failed to process "${file.name}": ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // Remove the ebook if processing failed
      setEbooks((prev) => prev.filter((ebook) => ebook.id !== newEbook.id));
    } finally {
      setIsProcessing(false);
      setProcessingBookId(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDelete = (id: string) => {
    setEbooks((prev) => prev.filter((ebook) => ebook.id !== id));
    setSuccessMessage("Book removed successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDownload = (ebook: Ebook, format: "ppt" | "docx" | "pdf") => {
    if (!ebook.extractedContent) {
      setErrorMessage("Content not available for download");
      return;
    }

    try {
      switch (format) {
        case "ppt":
          downloadPPT(ebook.name, ebook.extractedContent, ebook.fileName);
          break;
        case "docx":
          downloadDOCX(ebook.name, ebook.extractedContent, ebook.fileName);
          break;
        case "pdf":
          downloadPDF(ebook.name, ebook.extractedContent, ebook.fileName);
          break;
      }
      setSuccessMessage(`Downloading ${format.toUpperCase()}...`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        `Failed to generate ${format.toUpperCase()}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--neutral-50)", p: 3 }}>
      <Box sx={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "var(--font-primary)", mb: 1 }}
          >
            Ebook Processing
          </Typography>
          <Typography sx={{ color: "var(--font-secondary)" }}>
            Upload ebooks and extract content as PPT, DOCX, and PDF files
          </Typography>
        </Box>

        {/* Upload Section */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            border: `2px dashed ${
              isDragging ? "var(--primary-500)" : "var(--neutral-300)"
            }`,
            bgcolor: isDragging ? "var(--primary-50)" : "var(--neutral-0)",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub,.mobi,.txt"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CloudUploadIcon
              sx={{
                fontSize: 64,
                color: "var(--primary-500)",
              }}
            />
            <Typography variant="h6" sx={{ color: "var(--font-primary)" }}>
              {isDragging ? "Drop your ebook here" : "Drag and drop ebook here"}
            </Typography>
            <Typography sx={{ color: "var(--font-secondary)" }}>
              or click to browse
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "var(--font-secondary)", mt: 1 }}
            >
              Supported formats: PDF, EPUB, MOBI, TXT (Max 100MB)
            </Typography>
          </Box>
        </Paper>

        {/* Processing Indicator */}
        {isProcessing && processingBookId && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>
                Processing book... This may take a few seconds.
              </Typography>
            </Box>
            <LinearProgress sx={{ mt: 1 }} />
          </Alert>
        )}

        {/* Books List */}
        {ebooks.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Book Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>File Size</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Upload Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Downloads</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ebooks.map((ebook) => (
                  <TableRow key={ebook.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: "medium" }}>
                        {ebook.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)" }}
                      >
                        {ebook.fileName}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatFileSize(ebook.fileSize)}</TableCell>
                    <TableCell>{formatDate(ebook.uploadDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          ebook.status === "ready" ? "Ready" : "Processing"
                        }
                        color={ebook.status === "ready" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Download PowerPoint">
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                ebook.status !== "ready" || !ebook.formats.ppt
                              }
                              onClick={() => handleDownload(ebook, "ppt")}
                              sx={{
                                color:
                                  ebook.status === "ready" && ebook.formats.ppt
                                    ? "var(--primary-500)"
                                    : "var(--neutral-400)",
                              }}
                            >
                              <PptIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Download Word Document">
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                ebook.status !== "ready" || !ebook.formats.docx
                              }
                              onClick={() => handleDownload(ebook, "docx")}
                              sx={{
                                color:
                                  ebook.status === "ready" && ebook.formats.docx
                                    ? "var(--primary-500)"
                                    : "var(--neutral-400)",
                              }}
                            >
                              <DocxIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                ebook.status !== "ready" || !ebook.formats.pdf
                              }
                              onClick={() => handleDownload(ebook, "pdf")}
                              sx={{
                                color:
                                  ebook.status === "ready" && ebook.formats.pdf
                                    ? "var(--primary-500)"
                                    : "var(--neutral-400)",
                              }}
                            >
                              <PdfIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(ebook.id)}
                        sx={{ color: "var(--error-500)" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Empty State */}
        {ebooks.length === 0 && !isProcessing && (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography sx={{ color: "var(--font-secondary)" }}>
              No books uploaded yet. Upload an ebook to get started.
            </Typography>
          </Paper>
        )}

        {/* Snackbars */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={() => setErrorMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default EbookProcessingPage;
