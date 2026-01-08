'use client';

import { Paper, TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, X } from 'lucide-react';
import { memo, useCallback } from 'react';

interface JobSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  size?: 'small' | 'medium';
}

const JobSearchBarComponent = ({
  searchQuery,
  onSearchChange,
  onClear,
  placeholder = 'Search jobs, companies, or keywords...',
  size = 'medium',
}: JobSearchBarProps) => {
  const handleChange = useCallback((e: any) => {
    onSearchChange(String(e.target.value || ''));
  }, [onSearchChange]);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Search size={20} style={{ color: '#6b7280', marginLeft: 8 }} />
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchQuery || ''}
        onChange={handleChange}
        variant="standard"
        InputProps={{
          disableUnderline: true,
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClear}>
                <X size={18} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiInputBase-input': {
            fontSize: size === 'small' ? '0.95rem' : '1rem',
            py: 0.5,
          },
        }}
      />
    </Paper>
  );
};

export const JobSearchBar = memo<JobSearchBarProps>(JobSearchBarComponent, (prevProps, nextProps) => {
  return (
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.size === nextProps.size
  );
});
JobSearchBar.displayName = "JobSearchBar";

