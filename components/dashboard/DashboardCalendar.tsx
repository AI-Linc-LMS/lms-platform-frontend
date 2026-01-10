"use client";

import { useState } from "react";
import { Box, Typography, IconButton, Card } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartingDay =
      startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      days.push(null);
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();
  const todayDate = today.getDate();

  // Highlight specific dates (example: 23 and 27)
  const highlightedDates = [23, 27];

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#111827",
          mb: 2,
        }}
      >
        Status
      </Typography>
      <Card
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
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
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <Box>
            <IconButton
              size="small"
              onClick={handlePreviousMonth}
              sx={{ p: 0.5 }}
            >
              <IconWrapper icon="mdi:chevron-left" size={20} />
            </IconButton>
            <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.5 }}>
              <IconWrapper icon="mdi:chevron-right" size={20} />
            </IconButton>
          </Box>
        </Box>

        {/* Days of week header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 1,
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
            gap: 1,
          }}
        >
          {days.map((day, index) => {
            if (day === null) {
              return <Box key={index} sx={{ height: 32 }} />;
            }

            const isHighlighted = highlightedDates.includes(day);
            const isToday = isCurrentMonth && day === todayDate;

            return (
              <Box
                key={index}
                sx={{
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                  backgroundColor: isHighlighted
                    ? "#6366f1"
                    : isToday
                    ? "#E0E7FF"
                    : "transparent",
                  color: isHighlighted
                    ? "#ffffff"
                    : isToday
                    ? "#6366f1"
                    : "#111827",
                  fontWeight: isToday || isHighlighted ? 600 : 400,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: isHighlighted ? "#4F46E5" : "#F3F4F6",
                  },
                }}
              >
                {day}
              </Box>
            );
          })}
        </Box>
      </Card>
    </Box>
  );
};

