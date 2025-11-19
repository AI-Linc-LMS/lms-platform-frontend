import React from "react";

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

const colors = [
  { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
  { name: "Green", value: "#10b981", class: "bg-green-500" },
  { name: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  { name: "Red", value: "#ef4444", class: "bg-red-500" },
  { name: "Orange", value: "#f97316", class: "bg-orange-500" },
  { name: "Teal", value: "#14b8a6", class: "bg-teal-500" },
  { name: "Pink", value: "#ec4899", class: "bg-pink-500" },
  { name: "Indigo", value: "#6366f1", class: "bg-indigo-500" },
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onChange }) => {
  const defaultColor = "#3b82f6";
  const currentColor = selectedColor || defaultColor;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className={`w-8 h-8 rounded-full ${color.class} border-2 transition-all ${
              currentColor === color.value
                ? "border-gray-900 scale-110 ring-2 ring-gray-300"
                : "border-gray-300 hover:scale-105"
            }`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;

