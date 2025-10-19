import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { XIcon } from "lucide-react";

interface AttendanceDialogProps {
  open: boolean;
  selectedActivity?: { name?: string; title?: string };
  code: string;
  message: { text: string; type: "success" | "error" | "" };
  isPending: boolean;
  onClose: () => void;
  onCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AttendanceDialog: React.FC<AttendanceDialogProps> = ({
  open,
  selectedActivity,
  code,
  message,
  isPending,
  onClose,
  onCodeChange,
  onSubmit,
}) => {
  return (
    <Dialog
      open={open}
      onClose={!isPending ? onClose : undefined}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className: "rounded-xl p-2",
      }}
    >
      <DialogTitle className="text-[var(--primary-500)] font-bold text-lg !pb-1">
        <Box className="flex items-center justify-between">
          <Typography
            variant="h6"
            component="span"
            className="font-bold text-[var(--primary-500)]"
          >
            Mark Attendance for:{" "}
            {selectedActivity?.name || selectedActivity?.title}
          </Typography>
          <XIcon
            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-700 transition"
            onClick={onClose}
          />
        </Box>

        <Typography variant="body2" className="text-gray-600 mt-1 font-normal">
          Enter 6-digit attendance code
        </Typography>
      </DialogTitle>

      <DialogContent className="space-y-4 mt-2">
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            id="attendance-code"
            variant="outlined"
            value={code}
            onChange={onCodeChange}
            placeholder="000000"
            inputProps={{
              maxLength: 6,
              style: {
                textAlign: "center",
                fontSize: "2rem",
                letterSpacing: "0.5rem",
                fontWeight: "bold",
              },
            }}
            fullWidth
            disabled={isPending}
          />

          {message.text && (
            <Alert
              severity={message.type === "success" ? "success" : "error"}
              className="rounded-lg mt-4"
            >
              {message.text}
            </Alert>
          )}

          <DialogActions className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onClose}
              color="inherit"
              disabled={isPending}
              variant="outlined"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "var(--primary-500)",
                "&:hover": { backgroundColor: "#1a4a5f" },
              }}
              disabled={isPending || code.length !== 6}
              fullWidth
              size="large"
            >
              {isPending ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  Marking Attendance...
                </Box>
              ) : (
                "Mark Attendance"
              )}
            </Button>
          </DialogActions>
        </form>

        <p className="text-center text-sm text-gray-500 mt-2">
          💡 The attendance code is valid for only sometime
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDialog;
