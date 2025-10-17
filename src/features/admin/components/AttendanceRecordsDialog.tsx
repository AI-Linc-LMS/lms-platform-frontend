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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Attendance Records - {activity.name}
        <div className="text-sm font-normal text-gray-600 mt-1">
          Total Present: {records.length}
        </div>
      </DialogTitle>
      <DialogContent>
        {records.length > 0 ? (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Marked At</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{record.user_name}</TableCell>
                    <TableCell>{record.user_email || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(record.marked_at).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Present"
                        color="success"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attendance records yet
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceRecordsDialog;
