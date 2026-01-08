"use client";

import { Box, Typography } from "@mui/material";

interface SearchResultsInfoProps {
  searchQuery: string;
  filteredCount: number;
  totalCount: number;
}

export function SearchResultsInfo({
  searchQuery,
  filteredCount,
  totalCount,
}: SearchResultsInfoProps) {
  if (!searchQuery) return null;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: "#1e40af" }}>
        {filteredCount === 0 ? (
          <>
            No courses found for "
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {searchQuery}
            </Typography>
            "
          </>
        ) : (
          <>
            Found {filteredCount} course{filteredCount !== 1 ? "s" : ""}
            {filteredCount !== totalCount && <> out of {totalCount} total</>} for "
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {searchQuery}
            </Typography>
            "
          </>
        )}
      </Typography>
    </Box>
  );
}

