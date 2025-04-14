import { TooltipProps } from "recharts";

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-gray-700">{`Hours: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip; 