"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Card, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { dashboardService } from "@/lib/services/dashboard.service";

interface StreakTableProps {
  streakDays?: number[]; // Deprecated - will be fetched from API
  currentStreak?: number; // Deprecated - will be fetched from API
}

export const StreakTable = ({
  streakDays: propStreakDays,
  currentStreak: propCurrentStreak,
}: StreakTableProps) => {
  const [loading, setLoading] = useState(false);
  const [streakDays, setStreakDays] = useState<number[]>(propStreakDays || []);
  const [currentStreak, setCurrentStreak] = useState<number>(
    propCurrentStreak || 0
  );
  const [longestStreak, setLongestStreak] = useState<number>(0);

  useEffect(() => {
    loadMonthlyStreak();
  }, []);

  const loadMonthlyStreak = async () => {
    try {
      setLoading(true);
      // Get current month in YYYY-MM format
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;
      const data = await dashboardService.getMonthlyStreak(monthStr);
      setStreakDays(data.monthly_days || []);
      setCurrentStreak(data.current_streak || 0);
      setLongestStreak(data.longest_streak || 0);
    } catch (error: any) {
      // Fallback to props if API fails
      if (propStreakDays) setStreakDays(propStreakDays);
      if (propCurrentStreak) setCurrentStreak(propCurrentStreak);
    } finally {
      setLoading(false);
    }
  };
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  // Generate all days for the month
  const days = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isStreakDay = (day: number | null) => {
    if (day === null) return false;
    return streakDays.includes(day);
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    return day === today.getDate();
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          My Streak
        </Typography>
        {currentStreak > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: "#FEF3C7",
            }}
          >
            <IconWrapper
              icon="mdi:fire"
              size={18}
              style={{ color: "#F59E0B" }}
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#92400E",
              }}
            >
              {currentStreak} day streak
            </Typography>
          </Box>
        )}
      </Box>
      <Card
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#111827",
                mb: 2,
              }}
            >
              {monthNames[currentMonth]} {currentYear}
            </Typography>

            {/* Days of week header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
                mb: 1,
              }}
            >
              {daysOfWeek.map((day) => (
                <Typography
                  key={day}
                  sx={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6B7280",
                    py: 0.5,
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Calendar grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
              }}
            >
              {days.map((day, index) => {
                if (day === null) {
                  return <Box key={index} sx={{ height: 28 }} />;
                }

                const hasStreak = isStreakDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <Box
                    key={index}
                    sx={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1,
                      backgroundColor: hasStreak
                        ? "#6366f1"
                        : isCurrentDay
                        ? "#E0E7FF"
                        : "transparent",
                      color: hasStreak
                        ? "#ffffff"
                        : isCurrentDay
                        ? "#6366f1"
                        : "#111827",
                      fontWeight: hasStreak || isCurrentDay ? 600 : 400,
                      fontSize: "0.75rem",
                      border:
                        isCurrentDay && !hasStreak
                          ? "1px solid #6366f1"
                          : "none",
                    }}
                  >
                    {day}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};
