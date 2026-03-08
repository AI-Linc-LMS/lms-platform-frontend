"use client";

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ContentType } from "@/lib/services/admin/admin-content-management.service";

interface ContentFiltersProps {
  searchQuery: string;
  selectedType: ContentType | "all";
  selectedVerificationStatus: "all" | "verified" | "unverified";
  onSearchChange: (query: string) => void;
  onTypeChange: (type: ContentType | "all") => void;
  onVerificationStatusChange: (status: "all" | "verified" | "unverified") => void;
  onClearFilters: () => void;
}

const contentTypes: ContentType[] = [
  "Quiz",
  "Article",
  "Assignment",
  "CodingProblem",
  "DevCodingProblem",
  "VideoTutorial",
];

const typeToLabelKey: Record<ContentType, string> = {
  Quiz: "adminContentManagement.typeQuiz",
  Article: "adminContentManagement.typeArticle",
  Assignment: "adminContentManagement.typeAssignment",
  CodingProblem: "adminContentManagement.typeCodingProblem",
  DevCodingProblem: "adminContentManagement.typeDevCodingProblem",
  VideoTutorial: "adminContentManagement.typeVideoTutorial",
};

export function ContentFilters({
  searchQuery,
  selectedType,
  selectedVerificationStatus,
  onSearchChange,
  onTypeChange,
  onVerificationStatusChange,
  onClearFilters,
}: ContentFiltersProps) {
  const { t } = useTranslation("common");
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedType !== "all" ||
    selectedVerificationStatus !== "all";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
      }}
    >
      <TextField
        placeholder={t("adminContentManagement.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
              <IconWrapper
                icon="mdi:magnify"
                size={20}
                color="#9ca3af"
              />
            </Box>
          ),
        }}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
          },
        }}
      />

      <FormControl sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel>{t("adminContentManagement.type")}</InputLabel>
        <Select
          value={selectedType}
          label={t("adminContentManagement.type")}
          onChange={(e) => onTypeChange(e.target.value as ContentType | "all")}
        >
          <MenuItem value="all">{t("adminContentManagement.allTypes")}</MenuItem>
          {contentTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {t(typeToLabelKey[type])}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel>{t("adminContentManagement.verificationStatus")}</InputLabel>
        <Select
          value={selectedVerificationStatus}
          label={t("adminContentManagement.verificationStatus")}
          onChange={(e) =>
            onVerificationStatusChange(
              e.target.value as "all" | "verified" | "unverified"
            )
          }
        >
          <MenuItem value="all">{t("adminContentManagement.allStatus")}</MenuItem>
          <MenuItem value="verified">{t("adminContentManagement.verified")}</MenuItem>
          <MenuItem value="unverified">{t("adminContentManagement.unverified")}</MenuItem>
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          variant="outlined"
          onClick={onClearFilters}
          startIcon={<IconWrapper icon="mdi:close" size={18} />}
          sx={{
            minWidth: { xs: "100%", sm: "auto" },
            borderColor: "#d1d5db",
            color: "#6b7280",
            "&:hover": {
              borderColor: "#9ca3af",
              backgroundColor: "#f9fafb",
            },
          }}
        >
          {t("adminContentManagement.clearFilters")}
        </Button>
      )}
    </Box>
  );
}
