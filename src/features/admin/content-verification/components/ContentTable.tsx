import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { ContentListItem, CONTENT_TYPE_CONFIG } from "../types";

interface ContentTableProps {
  contents: ContentListItem[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onView: (content: ContentListItem) => void;
  onVerifyToggle: (content: ContentListItem) => void;
  isLoading?: boolean;
}

const ContentTable: React.FC<ContentTableProps> = ({
  contents,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onVerifyToggle,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <Typography sx={{ color: "var(--font-secondary)" }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (contents.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          bgcolor: "var(--neutral-50)",
          borderRadius: 1,
        }}
      >
        <Typography sx={{ color: "var(--font-secondary)" }}>
          No content found matching the filters.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          border: "1px solid",
          borderColor: "var(--neutral-200)",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "var(--neutral-50)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: 80 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 250 }}>
                Title
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: 180 }}>
                Type
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: 150 }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: 150 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((content) => {
                const typeConfig = CONTENT_TYPE_CONFIG[content.type] || {
                  label: content.type,
                  color: "#6b7280",
                };

                return (
                  <TableRow key={content.id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--font-secondary)",
                          fontWeight: "bold",
                        }}
                      >
                        {content.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        {content.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={typeConfig.label}
                        size="small"
                        sx={{
                          bgcolor: `${typeConfig.color}20`,
                          color: typeConfig.color,
                          fontWeight: "bold",
                          border: `1px solid ${typeConfig.color}40`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={content.is_verified ? "Verified" : "Unverified"}
                        size="small"
                        icon={
                          content.is_verified ? (
                            <CheckCircleIcon />
                          ) : (
                            <CancelIcon />
                          )
                        }
                        sx={{
                          bgcolor: content.is_verified
                            ? "var(--success-100)"
                            : "var(--neutral-100)",
                          color: content.is_verified
                            ? "var(--success-700)"
                            : "var(--font-secondary)",
                          fontWeight: "bold",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => onView(content)}
                            sx={{
                              color: "var(--primary-600)",
                              "&:hover": {
                                bgcolor: "var(--primary-50)",
                              },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            content.is_verified ? "Unverify" : "Verify"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => onVerifyToggle(content)}
                            sx={{
                              color: content.is_verified
                                ? "var(--warning-600)"
                                : "var(--success-600)",
                              "&:hover": {
                                bgcolor: content.is_verified
                                  ? "var(--warning-50)"
                                  : "var(--success-50)",
                              },
                            }}
                          >
                            {content.is_verified ? (
                              <CancelIcon fontSize="small" />
                            ) : (
                              <CheckCircleIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={contents.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{
          borderTop: "1px solid",
          borderColor: "var(--neutral-200)",
        }}
      />
    </>
  );
};

export default ContentTable;


