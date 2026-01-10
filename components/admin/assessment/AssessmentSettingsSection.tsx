"use client";

import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface AssessmentSettingsSectionProps {
  durationMinutes: number;
  isPaid: boolean;
  price: string;
  currency: string;
  isActive: boolean;
  onDurationChange: (value: number) => void;
  onPaidChange: (value: boolean) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
}

export function AssessmentSettingsSection({
  durationMinutes,
  isPaid,
  price,
  currency,
  isActive,
  onDurationChange,
  onPaidChange,
  onPriceChange,
  onCurrencyChange,
  onActiveChange,
}: AssessmentSettingsSectionProps) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#111827",
          mb: 1,
        }}
      >
        Assessment Settings
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
        Configure duration, pricing, and availability settings.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          label="Duration (minutes)"
          type="number"
          value={durationMinutes}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          fullWidth
          required
          inputProps={{ min: 1 }}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch checked={isPaid} onChange={(e) => onPaidChange(e.target.checked)} />
            }
            label="Paid Assessment"
          />
          {isPaid && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                ml: 4,
              }}
            >
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Enter price"
              />
              <FormControl fullWidth required>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="INR">INR (₹)</MenuItem>
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(e) => onActiveChange(e.target.checked)} />
            }
            label="Active"
          />
        </Box>
      </Box>
    </Box>
  );
}

