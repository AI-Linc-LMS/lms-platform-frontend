// import { useState, useEffect } from 'react';

interface Category {
    name: string;
    value: number;
    color: string;
    ring: number;
}

interface DashboardPieChartProps {
    data?: {
        totalCompletion: number;
        categories: Category[];
    } | null;
}

const DashboardPieChart = ({ data = null }: DashboardPieChartProps) => {
    // Default data if none is provided
    const defaultData = {
        totalCompletion: 25,
        categories: [
            { name: "Article", value: 19, color: "#3875F9", ring: 0 }, // Blue - outermost ring
            { name: "Video", value: 22, color: "#EED21B", ring: 1 },   // Yellow - second ring
            { name: "Problems", value: 5, color: "#417845", ring: 2 }, // Green - third ring
            { name: "Quiz", value: 9, color: "#2A8CB0", ring: 3 }      // Light blue - innermost ring
        ]
    };

    // Use provided data or defaults
    const chartData = data || defaultData;

    // Create concentric circles chart with consistent progress style
    const ConcentricCirclesChart = ({ categories }: { categories: Category[] }) => {
        // Define the radius values for each ring (from outer to inner)
        const ringRadii = [45, 35, 25, 15];
        const ringStrokeWidths = [10, 8, 6, 4];

        return (
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {ringRadii.map((radius, index) => (
                        <circle
                            key={`bg-${index}`}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#EEEEEE"
                            strokeWidth={ringStrokeWidths[index]}
                        />
                    ))}

                    {/* Draw progress arcs for each category */}
                    {categories.map((category, index) => {
                        const radius = ringRadii[category.ring];
                        const strokeWidth = ringStrokeWidths[category.ring];
                        const circumference = 2 * Math.PI * radius;

                        // Calculate stroke dash properties
                        const strokeDasharray = circumference;
                        const strokeDashoffset = circumference - (category.value / 100) * circumference;

                        return (
                            <circle
                                key={index}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke={category.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{
                                    transition: 'stroke-dashoffset 0.5s ease'
                                }}
                            />
                        );
                    })}
                </svg>
            </div>
        );
    };

    // Completion circle component
    const CompletionCircle = ({ percentage }: { percentage: number }) => {
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Gray background circle */}
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="#EEEEEE"
                        strokeWidth="10"
                    />

                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#2A9DC4"
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 0.5s ease'
                        }}
                    />
                </svg>

                {/* Percentage text in the center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#2A9DC4]">{percentage}%</span>
                    <span className="text-lg text-[#2A9DC4]">Completed</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 items-center justify-center mx-auto">
            <div className="w-full rounded-3xl bg-[#EFF9FC] border border-[#80C9E0] p-4 shadow-sm">
                <h1 className="font-sans text-[18px] text-[#343A40]">Dashboard</h1>
                <p className="text-[#495057] font-normal text-[12px] font-sans">A simple overview of your status.</p>

                {/* Charts container */}
                <div className="flex items-center justify-center gap-4 mt-6 mb-6">
                    <ConcentricCirclesChart categories={chartData.categories} />
                    <CompletionCircle percentage={chartData.totalCompletion} />
                </div>

                {/* Stats row */}
                <div className="flex justify-between">
                    {chartData.categories.map((category, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <span className="text-2xl font-bold" style={{ color: category.color }}>
                                {category.value}%
                            </span>
                            <div className="flex items-center gap-1 text-sm text-[#495057]">
                                {category.name === "Article" && (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" fill="#4169E1" />
                                    </svg>
                                )}
                                {category.name === "Video" && (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="10" height="10" rx="2" fill="#FFD700" />
                                    </svg>
                                )}
                                {category.name === "Problems" && (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3L13 13M3 13L13 3" stroke="#2E8B57" strokeWidth="2" />
                                    </svg>
                                )}
                                {category.name === "Quiz" && (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 5H13M3 8H13M3 11H8" stroke="#1E90FF" strokeWidth="2" />
                                    </svg>
                                )}
                                <span>{category.name}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="w-full mx-auto h-[62px] bg-[#DEE2E6] rounded-xl flex flex-row items-center justify-center p-4 gap-4 mt-3">
                    <div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5C12.1421 0.5 15.5 3.85786 15.5 8ZM8 12.3125C8.31065 12.3125 8.5625 12.0606 8.5625 11.75V7.25C8.5625 6.93935 8.31065 6.6875 8 6.6875C7.68935 6.6875 7.4375 6.93935 7.4375 7.25V11.75C7.4375 12.0606 7.68935 12.3125 8 12.3125ZM8 4.25C8.41423 4.25 8.75 4.58579 8.75 5C8.75 5.41421 8.41423 5.75 8 5.75C7.58577 5.75 7.25 5.41421 7.25 5C7.25 4.58579 7.58577 4.25 8 4.25Z" fill="#6C757D" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium font-sans text-[#6C757D]">Check out this awesome visual that shows exactly how far you've come in your course! It's like a fun map of your progress!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPieChart;