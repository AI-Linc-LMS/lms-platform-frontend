export interface FilterOption {
  id: string;
  label: string;
}

export const categoryOptions: FilterOption[] = [
  { id: "full_stack", label: "Full Stack Development" },
  { id: "front_end", label: "Front-End Development" },
  { id: "back_end", label: "Back-End Development" },
  { id: "ui_ux", label: "UI/UX Design" },
  { id: "data_science", label: "Data Science & Analytics" },
  { id: "marketing", label: "Marketing" },
  { id: "business", label: "Business" },
];

export const levelOptions: FilterOption[] = [
  { id: "Easy", label: "Beginner" },
  { id: "Medium", label: "Intermediate" },
  { id: "Hard", label: "Pro" },
];

export const priceOptions: FilterOption[] = [
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

export const ratingOptions: FilterOption[] = [
  { id: "4_up", label: "4 and up" },
  { id: "3_up", label: "3 and up" },
];
