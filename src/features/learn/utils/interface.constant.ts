export interface HoursSpentCardProps {
    timeRange: string;
    setTimeRange: (value: string) => void;
}

export interface HoursSpentData {
    date_range: string[];
    hours_spent: number[];
    units: string;
}