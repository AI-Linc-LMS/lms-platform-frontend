import { useTranslation } from "react-i18next";
import { FilterOption } from "./FilterOptions";

export const useTranslatedFilterOptions = () => {
  const { t } = useTranslation();

  const categoryOptions: FilterOption[] = [
    { id: "full_stack", label: t("filters.categories.fullStack") },
    { id: "front_end", label: t("filters.categories.frontEnd") },
    { id: "back_end", label: t("filters.categories.backEnd") },
    { id: "ui_ux", label: t("filters.categories.uiUx") },
    { id: "data_science", label: t("filters.categories.dataScience") },
    { id: "marketing", label: t("filters.categories.marketing") },
    { id: "business", label: t("filters.categories.business") },
  ];

  const levelOptions: FilterOption[] = [
    { id: "Easy", label: t("filters.difficulty.beginner") },
    { id: "Medium", label: t("filters.difficulty.intermediate") },
    { id: "Hard", label: t("filters.difficulty.pro") },
  ];

  const priceOptions: FilterOption[] = [
    { id: "free", label: t("filters.price.free") },
    { id: "paid", label: t("filters.price.paid") },
  ];

  const ratingOptions: FilterOption[] = [
    { id: "4_up", label: t("filters.rating.fourAndUp") },
    { id: "3_up", label: t("filters.rating.threeAndUp") },
  ];

  return {
    categoryOptions,
    levelOptions,
    priceOptions,
    ratingOptions,
  };
};