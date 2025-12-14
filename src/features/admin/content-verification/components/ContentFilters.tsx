import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import { ContentFilters as Filters } from "../types";

interface ContentFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const ContentFilters: React.FC<ContentFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({ ...filters, type: event.target.value });
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({ ...filters, verificationStatus: event.target.value });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: event.target.value });
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 2fr" },
        gap: 2,
        mb: 3,
      }}
    >
      <FormControl fullWidth>
        <InputLabel>Content Type</InputLabel>
        <Select
          value={filters.type}
          onChange={handleTypeChange}
          label="Content Type"
        >
          <MenuItem value="All">All Types</MenuItem>
          <MenuItem value="Quiz">Quiz</MenuItem>
          <MenuItem value="Article">Article</MenuItem>
          <MenuItem value="Assignment">Assignment</MenuItem>
          <MenuItem value="CodingProblem">Coding Problem</MenuItem>
          <MenuItem value="DevCodingProblem">Dev Coding Problem</MenuItem>
          <MenuItem value="VideoTutorial">Video Tutorial</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Verification Status</InputLabel>
        <Select
          value={filters.verificationStatus}
          onChange={handleStatusChange}
          label="Verification Status"
        >
          <MenuItem value="All">All Status</MenuItem>
          <MenuItem value="Verified">Verified</MenuItem>
          <MenuItem value="Unverified">Unverified</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Search"
        placeholder="Search by title..."
        value={filters.searchQuery}
        onChange={handleSearchChange}
      />
    </Box>
  );
};

export default ContentFilters;


