import { Box, Typography, Paper, Chip } from "@mui/material";
import { AssignmentDetails } from "../../types";

interface AssignmentViewProps {
  details: any;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({ details }) => {
  const assignmentDetails = details as AssignmentDetails;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        sx={{
          p: 3,
          border: "1px solid var(--neutral-200)",
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--font-secondary)",
              mb: 1,
            }}
          >
            Difficulty Level
          </Typography>
          <Chip
            label={assignmentDetails.difficulty_level}
            size="small"
            sx={{
              bgcolor: "var(--primary-100)",
              color: "var(--primary-700)",
            }}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--font-primary)",
              mb: 2,
            }}
          >
            Question
          </Typography>
          <Box
            sx={{
              "& img": {
                maxWidth: "100%",
                height: "auto",
              },
              "& a": {
                color: "var(--primary-600)",
                textDecoration: "underline",
              },
              "& pre": {
                bgcolor: "var(--neutral-100)",
                p: 2,
                borderRadius: 1,
                overflow: "auto",
              },
              "& code": {
                bgcolor: "var(--neutral-100)",
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontFamily: "monospace",
              },
            }}
            dangerouslySetInnerHTML={{ __html: assignmentDetails.question }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AssignmentView;


