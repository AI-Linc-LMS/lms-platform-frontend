import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

interface CreateAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  name: string;
  durationMinutes: string;
  onNameChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  formErrors: {
    name?: string[];
    duration_minutes?: string[];
  };
  isCreating: boolean;
}

const CreateAttendanceDialog: React.FC<CreateAttendanceDialogProps> = ({
  open,
  onClose,
  onSubmit,
  name,
  durationMinutes,
  onNameChange,
  onDurationChange,
  formErrors,
  isCreating,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Attendance Activity</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name *"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={!!formErrors.name}
          helperText={formErrors.name?.[0]}
          sx={{ mt: 2 }}
        />
        <TextField
          margin="dense"
          label="Duration (minutes) *"
          type="number"
          fullWidth
          variant="outlined"
          value={durationMinutes}
          onChange={(e) => onDurationChange(e.target.value)}
          error={!!formErrors.duration_minutes}
          helperText={formErrors.duration_minutes?.[0]}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained" disabled={isCreating}>
          {isCreating ? "Creating..." : "Generate Code"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAttendanceDialog;
