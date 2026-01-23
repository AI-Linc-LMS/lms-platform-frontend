"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Alert,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  title: string;
  subtitle?: string;
  currentImageUrl?: string;
  aspectRatio?: number; // width/height ratio
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

export function ImageUploadDialog({
  open,
  onClose,
  onUpload,
  title,
  subtitle,
  currentImageUrl,
  aspectRatio,
  maxSizeMB = 5,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
}: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setError("");
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setPreview(currentImageUrl || null);
      setError("");
      setCroppedImage(null);
      setUploading(false);
    }
  }, [open, currentImageUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Please select a valid image file (${acceptedFormats.join(", ").replace(/image\//g, "")})`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleCrop = () => {
    if (!preview || !aspectRatio) {
      setCroppedImage(preview);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate crop dimensions to maintain aspect ratio
      let cropWidth = img.width;
      let cropHeight = img.height;
      let cropX = 0;
      let cropY = 0;

      const imgAspectRatio = img.width / img.height;

      if (imgAspectRatio > aspectRatio) {
        // Image is wider than desired aspect ratio
        cropWidth = img.height * aspectRatio;
        cropX = (img.width - cropWidth) / 2;
      } else {
        // Image is taller than desired aspect ratio
        cropHeight = img.width / aspectRatio;
        cropY = (img.height - cropHeight) / 2;
      }

      // Set canvas size
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Draw cropped image
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            setCroppedImage(croppedUrl);
          }
        },
        "image/jpeg",
        0.9
      );
    };
    img.src = preview;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError("");

      // If we have a cropped image, use that instead
      if (croppedImage && canvasRef.current) {
        canvasRef.current.toBlob(
          async (blob) => {
            if (blob) {
              const croppedFile = new File([blob], selectedFile.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              await onUpload(croppedFile);
            } else {
              await onUpload(selectedFile);
            }
            handleClose();
          },
          "image/jpeg",
          0.9
        );
      } else {
        await onUpload(selectedFile);
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setPreview(currentImageUrl || null);
      setError("");
      setCroppedImage(null);
      onClose();
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Are you sure you want to remove this image?")) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      // Create a special file to signal removal - backend should handle null/empty
      const emptyFile = new File([], "remove", { type: "application/octet-stream" });
      await onUpload(emptyFile);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to remove image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const displayImage = croppedImage || preview;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: "100vh", sm: "90vh" },
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: { xs: 1.5, sm: 2 },
          px: { xs: 2.5, sm: 3 },
          pt: { xs: 2.5, sm: 3 },
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Box
          sx={{
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            borderRadius: "50%",
            backgroundColor: "rgba(10, 102, 194, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:image" size={20} color="#0a66c2" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
              mb: subtitle ? 0.25 : 0,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: "#666666",
                fontSize: "0.8125rem",
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={uploading}
          sx={{
            color: "#666666",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.05)",
            },
          }}
        >
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: { xs: 2.5, sm: 3 }, px: { xs: 2.5, sm: 3 }, pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography
              variant="caption"
              sx={{
                color: "#666666",
                fontSize: "0.8125rem",
                mt: 1,
                display: "block",
                textAlign: "center",
              }}
            >
              Uploading image...
            </Typography>
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {!displayImage ? (
          <Box
            sx={{
              border: "2px dashed rgba(0,0,0,0.12)",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              backgroundColor: "#f9fafb",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#0a66c2",
                backgroundColor: "rgba(10, 102, 194, 0.02)",
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconWrapper icon="mdi:cloud-upload" size={48} color="#9ca3af" />
            <Typography
              variant="body1"
              sx={{
                color: "#000000",
                fontWeight: 600,
                mt: 2,
                mb: 1,
              }}
            >
              Upload Image
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#666666",
                fontSize: "0.8125rem",
              }}
            >
              Click to select or drag and drop
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#9ca3af",
                fontSize: "0.75rem",
                mt: 1,
                display: "block",
              }}
            >
              Supported formats: JPG, PNG, WebP (Max {maxSizeMB}MB)
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                width: "100%",
                height: aspectRatio ? "auto" : { xs: 200, sm: 300 },
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.08)",
                backgroundColor: "#f9fafb",
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={displayImage}
                alt="Preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {aspectRatio && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: "2px dashed rgba(10, 102, 194, 0.5)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:image-edit" size={18} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "24px",
                  borderColor: "#0a66c2",
                  color: "#0a66c2",
                  "&:hover": {
                    borderColor: "#004182",
                    backgroundColor: "rgba(10, 102, 194, 0.05)",
                  },
                }}
              >
                Change Image
              </Button>
              {aspectRatio && (
                <Button
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:crop" size={18} />}
                  onClick={handleCrop}
                  disabled={uploading || !selectedFile}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "24px",
                    borderColor: "#666666",
                    color: "#666666",
                    "&:hover": {
                      borderColor: "#000000",
                      backgroundColor: "#f3f2ef",
                    },
                  }}
                >
                  Auto Crop
                </Button>
              )}
              {currentImageUrl && (
                <Button
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:delete" size={18} />}
                  onClick={handleRemove}
                  disabled={uploading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "24px",
                    borderColor: "#d32f2f",
                    color: "#d32f2f",
                    "&:hover": {
                      borderColor: "#b71c1c",
                      backgroundColor: "rgba(211, 47, 47, 0.05)",
                    },
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          </Box>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          borderTop: "1px solid rgba(0,0,0,0.08)",
          gap: { xs: 1, sm: 1.25 },
          flexDirection: { xs: "column-reverse", sm: "row" },
          backgroundColor: "#ffffff",
        }}
      >
        <Button
          onClick={handleClose}
          disabled={uploading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#666666",
            borderRadius: "24px",
            px: { xs: 3, sm: 3 },
            py: { xs: 1.125, sm: 0.875 },
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "auto", sm: 100 },
            border: "1px solid rgba(0,0,0,0.12)",
            "&:hover": {
              backgroundColor: "#f3f2ef",
              borderColor: "rgba(0,0,0,0.2)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={uploading || !selectedFile}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "#0a66c2",
            borderRadius: "24px",
            px: { xs: 3, sm: 3.5 },
            py: { xs: 1.125, sm: 0.875 },
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "auto", sm: 120 },
            boxShadow: "0 2px 4px rgba(10, 102, 194, 0.2)",
            "&:hover": {
              backgroundColor: "#004182",
              boxShadow: "0 4px 8px rgba(10, 102, 194, 0.3)",
            },
            "&:disabled": {
              backgroundColor: "#e5e7eb",
              color: "#9ca3af",
              boxShadow: "none",
            },
            transition: "all 0.2s ease",
          }}
        >
          {uploading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #ffffff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              Uploading...
            </Box>
          ) : (
            "Upload"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
