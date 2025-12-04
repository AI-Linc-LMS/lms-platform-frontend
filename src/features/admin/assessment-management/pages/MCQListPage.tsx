import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiSearch, FiFileText } from "react-icons/fi";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Typography,
  Collapse,
  Checkbox,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import {
  getMCQs,
  deleteMCQ,
  MCQListItem,
} from "../../../../services/admin/mcqApis";
import CreateEditMCQModal from "../components/CreateEditMCQModal";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mcq-tabpanel-${index}`}
      aria-labelledby={`mcq-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MCQListPage = () => {
  const queryClient = useQueryClient();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQListItem | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedMCQs, setSelectedMCQs] = useState<Set<number>>(new Set());

  // Fetch MCQs
  const {
    data: mcqs = [],
    isLoading,
    error,
  } = useQuery<MCQListItem[]>({
    queryKey: ["mcqs", clientId],
    queryFn: () => getMCQs(clientId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (mcqId: number) => deleteMCQ(clientId, mcqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcqs", clientId] });
      setDeleteConfirmId(null);
    },
  });

  // Filtered MCQs
  const filteredMCQs = useMemo(() => {
    return mcqs.filter((mcq) => {
      const matchesSearch =
        mcq.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mcq.topic &&
          mcq.topic.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDifficulty =
        filterDifficulty === "all" || mcq.difficulty_level === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [mcqs, searchTerm, filterDifficulty]);

  const handleEdit = (mcq: MCQListItem) => {
    setEditingMCQ(mcq);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingMCQ(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMCQ(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpansion = (mcqId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mcqId)) {
        newSet.delete(mcqId);
      } else {
        newSet.add(mcqId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = new Set(paginatedMCQs.map((mcq) => mcq.id));
      setSelectedMCQs(allIds);
    } else {
      setSelectedMCQs(new Set());
    }
  };

  const handleSelectOne = (mcqId: number) => {
    setSelectedMCQs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mcqId)) {
        newSet.delete(mcqId);
      } else {
        newSet.add(mcqId);
      }
      return newSet;
    });
  };

  const paginatedMCQs = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMCQs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMCQs, page, rowsPerPage]);

  const isAllSelected =
    paginatedMCQs.length > 0 &&
    paginatedMCQs.every((mcq) => selectedMCQs.has(mcq.id));

  const isSomeSelected =
    paginatedMCQs.some((mcq) => selectedMCQs.has(mcq.id)) && !isAllSelected;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--neutral-50)", p: 3 }}>
      <Box sx={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "var(--font-primary)",
              mb: 1,
            }}
          >
            MCQ Bank
          </Typography>
          <Typography sx={{ color: "var(--font-secondary)" }}>
            Manage your multiple choice questions library
          </Typography>
        </Box>

        {/* Actions Bar */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "var(--card-bg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { md: "center" },
              justifyContent: "space-between",
            }}
          >
            {/* Search */}
            <TextField
              placeholder="Search by question or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, maxWidth: { md: "400px" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch />
                  </InputAdornment>
                ),
              }}
            />

            {/* Filters and Actions */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  label="Difficulty"
                >
                  <MenuItem value="all">All Difficulty</MenuItem>
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                sx={{
                  bgcolor: "var(--primary-500)",
                  "&:hover": {
                    bgcolor: "var(--primary-700)",
                  },
                }}
              >
                Create MCQ
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Loading State */}
        {isLoading && (
          <Paper
            sx={{
              p: 12,
              textAlign: "center",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                border: "2px solid",
                borderColor: "var(--primary-500)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            <Typography sx={{ mt: 2, color: "var(--font-secondary)" }}>
              Loading MCQs...
            </Typography>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Paper
            sx={{
              p: 2,
              bgcolor: "var(--error-100)",
              borderLeft: "4px solid",
              borderColor: "var(--error-500)",
            }}
          >
            <Typography sx={{ fontWeight: "bold", color: "var(--error-600)" }}>
              Error loading MCQs
            </Typography>
            <Typography
              sx={{ fontSize: "0.875rem", color: "var(--error-600)", mt: 0.5 }}
            >
              {(error as Error).message}
            </Typography>
          </Paper>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredMCQs.length === 0 && (
          <Paper
            sx={{
              p: 12,
              textAlign: "center",
              bgcolor: "var(--card-bg)",
            }}
          >
            <FiFileText
              style={{
                fontSize: "48px",
                color: "var(--font-tertiary)",
                margin: "0 auto",
              }}
            />
            <Typography
              variant="h6"
              sx={{ mt: 2, color: "var(--font-primary)" }}
            >
              No MCQs found
            </Typography>
            <Typography sx={{ mt: 1, color: "var(--font-secondary)" }}>
              {searchTerm || filterDifficulty !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first MCQ"}
            </Typography>
            {!searchTerm && filterDifficulty === "all" && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                sx={{
                  mt: 3,
                  bgcolor: "var(--primary-500)",
                  "&:hover": {
                    bgcolor: "var(--primary-700)",
                  },
                }}
              >
                Create MCQ
              </Button>
            )}
          </Paper>
        )}

        {/* Tabs */}
        {!isLoading && !error && filteredMCQs.length > 0 && (
          <Paper sx={{ bgcolor: "var(--card-bg)" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: "var(--neutral-200)",
                "& .MuiTab-root": {
                  color: "var(--font-secondary)",
                  fontWeight: 500,
                },
                "& .Mui-selected": {
                  color: "var(--primary-600)",
                },
                "& .MuiTabs-indicator": {
                  bgcolor: "var(--primary-600)",
                },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Questions" />
            </Tabs>

            {/* Tab 1: Overview */}
            <TabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 3,
                }}
              >
                <Box>
                  <Card
                    sx={{
                      bgcolor: "var(--primary-50)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--font-secondary)",
                          mb: 1,
                        }}
                      >
                        Total MCQs
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          color: "var(--primary-700)",
                        }}
                      >
                        {mcqs.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card
                    sx={{
                      bgcolor: "var(--success-50)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--font-secondary)",
                          mb: 1,
                        }}
                      >
                        Easy
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          color: "var(--success-500)",
                        }}
                      >
                        {
                          mcqs.filter((m) => m.difficulty_level === "Easy")
                            .length
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card
                    sx={{
                      bgcolor: "var(--warning-100)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--font-secondary)",
                          mb: 1,
                        }}
                      >
                        Medium
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          color: "var(--warning-500)",
                        }}
                      >
                        {
                          mcqs.filter((m) => m.difficulty_level === "Medium")
                            .length
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card
                    sx={{
                      bgcolor: "var(--error-100)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--font-secondary)",
                          mb: 1,
                        }}
                      >
                        Hard
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          color: "var(--error-600)",
                        }}
                      >
                        {
                          mcqs.filter((m) => m.difficulty_level === "Hard")
                            .length
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </TabPanel>

            {/* Tab 2: Questions Table */}
            <TabPanel value={tabValue} index={1}>
              {selectedMCQs.size > 0 && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: "var(--primary-50)",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{ color: "var(--primary-700)", fontWeight: 500 }}
                  >
                    {selectedMCQs.size} MCQ{selectedMCQs.size > 1 ? "s" : ""}{" "}
                    selected
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setSelectedMCQs(new Set())}
                    sx={{ color: "var(--primary-600)" }}
                  >
                    Clear Selection
                  </Button>
                </Box>
              )}
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "var(--neutral-50)" }}>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: 50 }}>
                        <Checkbox
                          indeterminate={isSomeSelected}
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          sx={{
                            color: "var(--primary-500)",
                            "&.Mui-checked": {
                              color: "var(--primary-600)",
                            },
                            "&.MuiCheckbox-indeterminate": {
                              color: "var(--primary-600)",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 50 }}></TableCell>
                      <TableCell sx={{ width: 70 }}>ID</TableCell>
                      <TableCell sx={{ minWidth: 300 }}>Question</TableCell>
                      <TableCell sx={{ width: 110 }}>Correct</TableCell>
                      <TableCell sx={{ width: 120 }}>Difficulty</TableCell>
                      <TableCell sx={{ width: 140 }}>Topic</TableCell>
                      <TableCell sx={{ width: 110 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedMCQs.map((mcq) => (
                      <>
                        <TableRow
                          key={mcq.id}
                          hover
                          selected={selectedMCQs.has(mcq.id)}
                          sx={{
                            "&:hover": {
                              bgcolor: "var(--neutral-50)",
                            },
                            "&.Mui-selected": {
                              bgcolor: "var(--primary-50)",
                            },
                            "&.Mui-selected:hover": {
                              bgcolor: "var(--primary-100)",
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedMCQs.has(mcq.id)}
                              onChange={() => handleSelectOne(mcq.id)}
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                color: "var(--primary-500)",
                                "&.Mui-checked": {
                                  color: "var(--primary-600)",
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(mcq.id)}
                              sx={{
                                color: "var(--font-secondary)",
                                "&:hover": {
                                  bgcolor: "var(--neutral-100)",
                                },
                              }}
                            >
                              {expandedRows.has(mcq.id) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "var(--font-primary)",
                              fontWeight: 500,
                            }}
                          >
                            #{mcq.id}
                          </TableCell>
                          <TableCell sx={{ color: "var(--font-primary)" }}>
                            <Typography
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.5,
                                fontSize: "0.95rem",
                              }}
                            >
                              {mcq.question_text}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mcq.correct_option}
                              size="small"
                              sx={{
                                bgcolor: "var(--primary-100)",
                                color: "var(--primary-700)",
                                fontWeight: "bold",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mcq.difficulty_level}
                              size="small"
                              sx={{
                                bgcolor:
                                  mcq.difficulty_level === "Easy"
                                    ? "var(--success-100)"
                                    : mcq.difficulty_level === "Medium"
                                    ? "var(--warning-100)"
                                    : "var(--error-100)",
                                color:
                                  mcq.difficulty_level === "Easy"
                                    ? "var(--success-500)"
                                    : mcq.difficulty_level === "Medium"
                                    ? "var(--warning-500)"
                                    : "var(--error-600)",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "var(--font-secondary)" }}>
                            {mcq.topic || "-"}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(mcq)}
                                sx={{
                                  color: "var(--primary-600)",
                                  "&:hover": {
                                    bgcolor: "var(--primary-50)",
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteConfirmId(mcq.id)}
                                sx={{
                                  color: "var(--error-500)",
                                  "&:hover": {
                                    bgcolor: "var(--error-100)",
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            sx={{ py: 0, borderBottom: 0 }}
                          >
                            <Collapse
                              in={expandedRows.has(mcq.id)}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box
                                sx={{
                                  py: 3,
                                  px: 2,
                                  bgcolor: "var(--neutral-50)",
                                  borderRadius: 1,
                                  my: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: "bold",
                                    mb: 2,
                                    color: "var(--font-primary)",
                                  }}
                                >
                                  Question Details:
                                </Typography>
                                <Typography
                                  sx={{
                                    mb: 3,
                                    color: "var(--font-primary)",
                                  }}
                                >
                                  {mcq.question_text}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                      xs: "repeat(1, 1fr)",
                                      sm: "repeat(2, 1fr)",
                                    },
                                    gap: 2,
                                  }}
                                >
                                  <Tooltip
                                    title={mcq.option_a}
                                    arrow
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        bgcolor:
                                          mcq.correct_option === "A"
                                            ? "var(--success-100)"
                                            : "var(--card-bg)",
                                        border: "1px solid",
                                        borderColor:
                                          mcq.correct_option === "A"
                                            ? "var(--success-500)"
                                            : "var(--neutral-200)",
                                        borderRadius: 1,
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: "bold",
                                          color: "var(--font-secondary)",
                                        }}
                                      >
                                        Option A
                                        {mcq.correct_option === "A" && " ✓"}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: "var(--font-primary)",
                                          mt: 0.5,
                                        }}
                                      >
                                        {mcq.option_a}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                  <Tooltip
                                    title={mcq.option_b}
                                    arrow
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        bgcolor:
                                          mcq.correct_option === "B"
                                            ? "var(--success-100)"
                                            : "var(--card-bg)",
                                        border: "1px solid",
                                        borderColor:
                                          mcq.correct_option === "B"
                                            ? "var(--success-500)"
                                            : "var(--neutral-200)",
                                        borderRadius: 1,
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: "bold",
                                          color: "var(--font-secondary)",
                                        }}
                                      >
                                        Option B
                                        {mcq.correct_option === "B" && " ✓"}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: "var(--font-primary)",
                                          mt: 0.5,
                                        }}
                                      >
                                        {mcq.option_b}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                  <Tooltip
                                    title={mcq.option_c}
                                    arrow
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        bgcolor:
                                          mcq.correct_option === "C"
                                            ? "var(--success-100)"
                                            : "var(--card-bg)",
                                        border: "1px solid",
                                        borderColor:
                                          mcq.correct_option === "C"
                                            ? "var(--success-500)"
                                            : "var(--neutral-200)",
                                        borderRadius: 1,
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: "bold",
                                          color: "var(--font-secondary)",
                                        }}
                                      >
                                        Option C
                                        {mcq.correct_option === "C" && " ✓"}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: "var(--font-primary)",
                                          mt: 0.5,
                                        }}
                                      >
                                        {mcq.option_c}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                  <Tooltip
                                    title={mcq.option_d}
                                    arrow
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        bgcolor:
                                          mcq.correct_option === "D"
                                            ? "var(--success-100)"
                                            : "var(--card-bg)",
                                        border: "1px solid",
                                        borderColor:
                                          mcq.correct_option === "D"
                                            ? "var(--success-500)"
                                            : "var(--neutral-200)",
                                        borderRadius: 1,
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: "bold",
                                          color: "var(--font-secondary)",
                                        }}
                                      >
                                        Option D
                                        {mcq.correct_option === "D" && " ✓"}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: "var(--font-primary)",
                                          mt: 0.5,
                                        }}
                                      >
                                        {mcq.option_d}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                </Box>

                                {mcq.explanation && (
                                  <Box sx={{ mt: 3 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: "bold",
                                        color: "var(--font-secondary)",
                                      }}
                                    >
                                      Explanation:
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: "var(--font-primary)",
                                        mt: 0.5,
                                      }}
                                    >
                                      {mcq.explanation}
                                    </Typography>
                                  </Box>
                                )}

                                {mcq.skills && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: "bold",
                                        color: "var(--font-secondary)",
                                      }}
                                    >
                                      Skills:
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: "var(--font-primary)",
                                        mt: 0.5,
                                      }}
                                    >
                                      {mcq.skills}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredMCQs.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  borderTop: "1px solid",
                  borderColor: "var(--neutral-200)",
                }}
              />
            </TabPanel>
          </Paper>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirmId}
          onClose={() => !deleteMutation.isPending && setDeleteConfirmId(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              color: "var(--font-primary)",
              fontWeight: "bold",
            }}
          >
            Delete MCQ
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "var(--font-secondary)" }}>
              Are you sure you want to delete this MCQ? This action cannot be
              undone.
            </Typography>
            {deleteMutation.isError && (
              <Typography
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "var(--error-100)",
                  color: "var(--error-600)",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                }}
              >
                Error: {(deleteMutation.error as Error).message}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteMutation.isPending}
              sx={{
                color: "var(--font-primary)",
                borderColor: "var(--neutral-200)",
                "&:hover": {
                  bgcolor: "var(--neutral-50)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                deleteConfirmId && deleteMutation.mutate(deleteConfirmId)
              }
              disabled={deleteMutation.isPending}
              variant="contained"
              sx={{
                bgcolor: "var(--error-500)",
                "&:hover": {
                  bgcolor: "var(--error-600)",
                },
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <CreateEditMCQModal
            mcq={editingMCQ}
            onClose={handleCloseModal}
            clientId={clientId}
          />
        )}
      </Box>
    </Box>
  );
};

export default MCQListPage;
