"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Alert, Typography, Button } from "@mui/material";

interface ForceSubmitDialogProps {
  open: boolean;
  maxViolations: number;
  onSubmit: () => void;
}

export function ForceSubmitDialog({
  open,
  maxViolations,
  onSubmit,
}: ForceSubmitDialogProps) {
  return (
    <Dialog open={open} onClose={() => {}}>
      <DialogTitle>
        <Typography variant="h6" color="error">
          Maximum Violations Reached
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          You have reached the maximum violation threshold ({maxViolations}{" "}
          violations). Your assessment will be submitted automatically.
        </Alert>
        <Typography>
          All your progress has been saved and will be reviewed along with the
          proctoring violations.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          sx={{
            backgroundColor: "#374151",
            "&:hover": {
              backgroundColor: "#1f2937",
            },
          }}
        >
          Submit Assessment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

