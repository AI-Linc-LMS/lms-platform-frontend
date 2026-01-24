"use client";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ContentListItem,
  ContentType,
} from "@/lib/services/admin/admin-content-management.service";

interface ContentTableProps {
  contents: ContentListItem[];
  onViewDetails: (contentId: number) => void;
  onToggleVerification: (contentId: number, isVerified: boolean) => void;
  verifyingIds: Set<number>;
}

const getTypeColor = (type: ContentType) => {
  const colors: Record<ContentType, { bg: string; text: string }> = {
    Quiz: { bg: "#eef2ff", text: "#6366f1" },
    Article: { bg: "#d1fae5", text: "#10b981" },
    Assignment: { bg: "#fef3c7", text: "#f59e0b" },
    CodingProblem: { bg: "#ede9fe", text: "#8b5cf6" },
    DevCodingProblem: { bg: "#fce7f3", text: "#ec4899" },
    VideoTutorial: { bg: "#fee2e2", text: "#ef4444" },
  };
  return colors[type] || { bg: "#f3f4f6", text: "#6b7280" };
};

export function ContentTable({
  contents,
  onViewDetails,
  onToggleVerification,
  verifyingIds,
}: ContentTableProps) {
  return (
    <TableContainer sx={{ width: "100%" }}>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f9fafb" }}>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Title
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", sm: "table-cell" },
              }}
            >
              Type
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", md: "table-cell" },
              }}
            >
              Verification Status
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                textAlign: "center",
              }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No contents found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            contents.map((content) => {
              const typeColor = getTypeColor(content.type);
              const isVerifying = verifyingIds.has(content.id);

              return (
                <TableRow
                  key={content.id}
                  sx={{
                    "&:hover": { backgroundColor: "#f9fafb" },
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "#111827",
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      {content.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Chip
                      label={content.type}
                      size="small"
                      sx={{
                        bgcolor: typeColor.bg,
                        color: typeColor.text,
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        height: { xs: 20, sm: 24 },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Chip
                      label={content.is_verified ? "Verified" : "Unverified"}
                      size="small"
                      sx={{
                        bgcolor: content.is_verified ? "#d1fae5" : "#fee2e2",
                        color: content.is_verified ? "#065f46" : "#991b1b",
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        height: { xs: 20, sm: 24 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Tooltip
                        title={
                          content.is_verified
                            ? "Click to unverify"
                            : "Click to verify"
                        }
                      >
                        <Switch
                          checked={content.is_verified}
                          onChange={() =>
                            onToggleVerification(content.id, !content.is_verified)
                          }
                          disabled={isVerifying}
                          size="small"
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#10b981",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "#10b981",
                              },
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onViewDetails(content.id)}
                          sx={{ color: "#6366f1" }}
                        >
                          <IconWrapper icon="mdi:eye" size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
