"use client";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ContentListItem,
  ContentType,
} from "@/lib/services/admin/admin-content-management.service";

interface ContentTableProps {
  contents: ContentListItem[];
  onViewDetails: (contentId: number) => void;
  onToggleVerification: (contentId: number, isVerified: boolean) => void;
  verifyingIds: Set<number>;
}

const getTypeColor = (type: ContentType) => {
  const colors: Record<ContentType, { bg: string; text: string }> = {
    Quiz: {
      bg: "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
      text: "var(--accent-indigo)",
    },
    Article: {
      bg: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)",
      text: "var(--success-500)",
    },
    Assignment: {
      bg: "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)",
      text: "var(--warning-500)",
    },
    CodingProblem: {
      bg: "color-mix(in srgb, var(--accent-purple) 14%, var(--surface) 86%)",
      text: "var(--accent-purple)",
    },
    DevCodingProblem: {
      bg: "color-mix(in srgb, var(--accent-purple) 10%, var(--surface) 90%)",
      text: "var(--accent-purple)",
    },
    VideoTutorial: {
      bg: "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
      text: "var(--error-500)",
    },
  };
  return colors[type] || { bg: "var(--surface)", text: "var(--font-secondary)" };
};

const typeToLabelKey: Record<ContentType, string> = {
  Quiz: "adminContentManagement.typeQuiz",
  Article: "adminContentManagement.typeArticle",
  Assignment: "adminContentManagement.typeAssignment",
  CodingProblem: "adminContentManagement.typeCodingProblem",
  DevCodingProblem: "adminContentManagement.typeDevCodingProblem",
  VideoTutorial: "adminContentManagement.typeVideoTutorial",
};

export function ContentTable({
  contents,
  onViewDetails,
  onToggleVerification,
  verifyingIds,
}: ContentTableProps) {
  const { t } = useTranslation("common");
  return (
    <TableContainer sx={{ width: "100%" }}>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "var(--surface)" }}>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {t("adminContentManagement.titleColumn")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", sm: "table-cell" },
              }}
            >
              {t("adminContentManagement.typeColumn")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", md: "table-cell" },
              }}
            >
              {t("adminContentManagement.verificationStatusColumn")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                textAlign: "center",
              }}
            >
              {t("adminContentManagement.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("adminContentManagement.noContentsFound")}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            contents.map((content) => {
              const typeColor = getTypeColor(content.type);
              const isVerifying = verifyingIds.has(content.id);

              return (
                <TableRow
                  key={content.id}
                  sx={{
                    "&:hover": { backgroundColor: "var(--surface)" },
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "var(--font-primary)",
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      {content.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Chip
                      label={t(typeToLabelKey[content.type])}
                      size="small"
                      sx={{
                        bgcolor: typeColor.bg,
                        color: typeColor.text,
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        height: { xs: 20, sm: 24 },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Chip
                      label={content.is_verified ? t("adminContentManagement.verified") : t("adminContentManagement.unverified")}
                      size="small"
                      sx={{
                        bgcolor: content.is_verified
                          ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                          : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                        color: content.is_verified
                          ? "var(--success-500)"
                          : "var(--error-500)",
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        height: { xs: 20, sm: 24 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Tooltip
                        title={
                          content.is_verified
                            ? t("adminContentManagement.clickToUnverify")
                            : t("adminContentManagement.clickToVerify")
                        }
                      >
                        <Switch
                          checked={content.is_verified ?? false}
                          onChange={() =>
                            onToggleVerification(
                              content.id,
                              !(content.is_verified ?? false),
                            )
                          }
                          disabled={isVerifying}
                          size="small"
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "var(--success-500)",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "var(--success-500)",
                              },
                          }}
                        />
                      </Tooltip>
                      <Tooltip title={t("adminContentManagement.viewDetails")}>
                        <IconButton
                          size="small"
                          onClick={() => onViewDetails(content.id)}
                          sx={{ color: "var(--accent-indigo)" }}
                        >
                          <IconWrapper icon="mdi:eye" size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
