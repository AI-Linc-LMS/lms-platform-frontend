import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  AttendanceActivity,
  AttendanceRecord,
} from "../../../services/attendanceApis";

interface AttendanceRecordsDialogProps {
  open: boolean;
  activity: AttendanceActivity;
  records: AttendanceRecord[];
  onClose: () => void;
}

const AttendanceRecordsDialog: React.FC<AttendanceRecordsDialogProps> = ({
  open,
  activity,
  records,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Attendance Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {activity.name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: "#f8fafc" }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Session code: <strong>{activity.code || "-"}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total attendees marked present: <strong>{records.length}</strong>
          </Typography>
        </Box>

        {records.length > 0 ? (
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 480 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 64 }}>#</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Marked At</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow
                      key={record.id}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(248, 250, 252, 0.7)",
                        },
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {record.user_name || "Unknown"}
                      </TableCell>
                      <TableCell>{record.user_email || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(record.marked_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Present"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Box
            sx={{
              borderRadius: 2,
              border: "1px dashed rgba(148, 163, 184, 0.5)",
              py: 6,
              textAlign: "center",
              color: "text.secondary",
              backgroundColor: "rgba(248, 250, 252, 0.7)",
            }}
          >
            No attendance records have been marked for this session yet.
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceRecordsDialog;
