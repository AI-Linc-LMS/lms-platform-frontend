"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Card, CircularProgress, Tooltip } from "@mui/material";
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
  const [streakData, setStreakData] = useState<{ [date: string]: boolean }>({});
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
      
      // Use new streak object format if available, otherwise fall back to monthly_days
      if (data.streak && Object.keys(data.streak).length > 0) {
        setStreakData(data.streak);
        // Convert streak object to day numbers array for backward compatibility
        const daysWithStreak: number[] = [];
        Object.keys(data.streak).forEach((dateStr) => {
          if (data.streak![dateStr]) {
            const date = new Date(dateStr);
            daysWithStreak.push(date.getDate());
          }
        });
        setStreakDays(daysWithStreak);
      } else {
        // Fallback to monthly_days array format
        setStreakDays(data.monthly_days || []);
        setStreakData({});
      }
      
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
    
    // First check the new streak object format
    if (Object.keys(streakData).length > 0) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return streakData[dateStr] === true;
    }
    
    // Fallback to monthly_days array format
    return streakDays.includes(day);
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    return day === today.getDate();
  };

  const isFutureDate = (day: number | null) => {
    if (day === null) return false;
    const dayDate = new Date(currentYear, currentMonth, day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dayDate > todayDate;
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
                const isFuture = isFutureDate(day);

                const dayBoxContent = (
                  <Box
                    sx={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1,
                      backgroundColor: hasStreak
                        ? "#F59E0B"
                        : isCurrentDay
                        ? "#FEF3C7"
                        : "transparent",
                      color: hasStreak
                        ? "#ffffff"
                        : isCurrentDay
                        ? "#92400E"
                        : isFuture
                        ? "#9CA3AF"
                        : "#111827",
                      fontWeight: hasStreak || isCurrentDay ? 600 : 400,
                      fontSize: "0.75rem",
                      border:
                        isCurrentDay && !hasStreak
                          ? "1px solid #F59E0B"
                          : "none",
                      cursor: isFuture ? "not-allowed" : "pointer",
                      opacity: isFuture ? 0.5 : 1,
                      transition: "all 0.2s ease",
                      "&:hover": !isFuture
                        ? {
                            backgroundColor: hasStreak
                              ? "#D97706"
                              : isCurrentDay
                              ? "#FDE68A"
                              : "#F3F4F6",
                            transform: "scale(1.05)",
                          }
                        : {},
                    }}
                  >
                    {day}
                  </Box>
                );

                // For future dates, return without tooltip
                if (isFuture) {
                  return <Box key={index}>{dayBoxContent}</Box>;
                }

                // For past/present dates, wrap with tooltip
                return (
                  <Tooltip
                    key={index}
                    title={hasStreak ? "Streak" : "No streak"}
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#1F2937",
                          color: "#FFFFFF",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          padding: "6px 12px",
                          borderRadius: 1,
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        },
                      },
                      arrow: {
                        sx: {
                          color: "#1F2937",
                        },
                      },
                    }}
                  >
                    {dayBoxContent}
                  </Tooltip>
                );
              })}
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};
