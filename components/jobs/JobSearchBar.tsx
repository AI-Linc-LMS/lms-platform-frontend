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
  /** Use in hero/dark backgrounds for elevated white look */
  variant?: 'default' | 'hero';
}

const JobSearchBarComponent = ({
  searchQuery,
  onSearchChange,
  onClear,
  placeholder = 'Search jobs, companies, or keywords...',
  size = 'medium',
  variant = 'default',
}: JobSearchBarProps) => {
  const handleChange = useCallback((e: any) => {
    onSearchChange(String(e.target.value || ''));
  }, [onSearchChange]);
  const isHero = variant === 'hero';
  return (
    <Paper
      elevation={isHero ? 2 : 0}
      sx={{
        p: isHero ? 1.75 : 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isHero ? 'color-mix(in srgb, var(--font-light) 30%, transparent)' : 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: isHero ? 'var(--font-light)' : undefined,
        boxShadow: isHero
          ? '0 4px 20px color-mix(in srgb, var(--font-primary) 18%, transparent)'
          : undefined,
      }}
    >
      <Search size={20} style={{ color: 'var(--font-secondary)', marginLeft: 8 }} />
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

