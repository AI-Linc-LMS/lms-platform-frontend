import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

type Event = {
  date: string; // "YYYY-MM-DD"
  name: string;
  link: string;
};

type CalendarProps = {
  events: Event[];
};

const Calendar: React.FC<CalendarProps> = ({ events }) => {
  // Manual implementation for v1
  function addMonths(date: Date, count: number): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + count);
    return newDate;
  }

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const startDate = startOfWeek(startOfMonth(currentMonth), {
    weekStartsOn: 0,
  });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

  const getEventForDay = (day: Date): Event | undefined =>
    (events ?? []).find((e) => isSameDay(parseISO(e.date), day));

  const handleDayClick = (day: Date) => {
    const event = getEventForDay(day);
    if (!event) return;
    const isToday = isSameDay(day, new Date());

    // If the event is in the past → open recording link
    if (isToday) {
      window.open(event.link, "_blank");
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={prevMonth}
        className="text-gray-600 hover:text-blue-500 font-bold text-xl"
      >
        ←
      </button>
      <h2 className="text-2xl font-bold text-gray-800">
        {format(currentMonth, "MMMM yyyy")}
      </h2>
      <button
        onClick={nextMonth}
        className="text-gray-600 hover:text-blue-500 font-bold text-xl"
      >
        →
      </button>
    </div>
  );

  const renderDays = () => (
    <div className="grid grid-cols-7 text-sm font-semibold text-center text-gray-500 mb-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day}>{day}</div>
      ))}
    </div>
  );

  const renderCells = () => {
    const rows = [];
    let day = startDate;
    let days = [];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const isCurrentMonth = isSameMonth(day, currentMonth);
        const isToday = isSameDay(day, new Date());
        const isBeforeToday = day < new Date();
        const isAfterToday = day > new Date();
        const event = getEventForDay(day);
        console.log("Event for day:", day, event);

        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDayClick(day)}
            title={event?.name || ""}
            className={`lg:h-14 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer relative group
            ${!isCurrentMonth ? "text-gray-400" : ""}
            ${isToday ? "border-2 border-blue-500 font-semibold" : ""}
            ${
              isToday && event
                ? "border-2 border-green-800 bg-green-500 text-white font-semibold"
                : ""
            }
            ${
              isBeforeToday && event
                ? "border-2 border-black bg-gray-200 text-[var(--font-dark)]"
                : ""
            }
            ${
              isAfterToday && event ? "bg-blue-500 text-white font-medium" : ""
            }`}
          >
            {format(day, "d")}

            {event && (
              <span
                className="absolute bottom-1 text-[10px] px-1 py-0.5 bg-white text-green-600 rounded hidden group-hover:block"
                style={{ transform: "translateY(100%)" }}
              >
                {event.name}
              </span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }

      rows.push(
        <div className="grid grid-cols-7 gap-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="flex flex-col gap-2">{rows}</div>;
  };

  return (
    <div className="w-full max-w-md lg:min-w-xl p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default Calendar;
