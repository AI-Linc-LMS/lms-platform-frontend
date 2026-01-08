"use client";

import { useState } from "react";
import { Paper, Typography, Box, Tabs, Tab } from "@mui/material";
import { ContentDetail } from "@/lib/services/courses.service";
import { SubmoduleComments } from "./SubmoduleComments";

interface VideoTabsProps {
  content: ContentDetail;
  comments: any[];
  newComment: string;
  submittingComment: boolean;
  selectedContentId: number | null;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
}

export function VideoTabs({
  content,
  comments,
  newComment,
  submittingComment,
  selectedContentId,
  onCommentChange,
  onSubmitComment,
}: VideoTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid #e5e7eb" }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              minHeight: 48,
            },
            "& .Mui-selected": {
              color: "#6366f1",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#6366f1",
            },
          }}
        >
          <Tab label="Description" />
          <Tab label="Comments" />
        </Tabs>
      </Box>

      <Box sx={{ minHeight: 200 }}>
        {activeTab === 0 && (
          <Box
            sx={{
              p: 3,
            }}
          >
            {content.details?.description ? (
              <Box
                dangerouslySetInnerHTML={{
                  __html: content.details.description,
                }}
                sx={{
                  "& h2, & h3": {
                    color: "#1a1f2e",
                    fontWeight: 600,
                    mt: 2,
                    mb: 1,
                  },
                  "& p": {
                    color: "#4b5563",
                    lineHeight: 1.7,
                    mb: 1.5,
                  },
                  "& ul, & ol": {
                    color: "#4b5563",
                    pl: 3,
                    mb: 1.5,
                  },
                  "& li": {
                    mb: 0.5,
                  },
                  "& code": {
                    backgroundColor: "#f3f4f6",
                    padding: "2px 6px",
                    borderRadius: 1,
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                  },
                  "& pre": {
                    backgroundColor: "#1a1f2e",
                    color: "#ffffff",
                    padding: 2,
                    borderRadius: 1,
                    overflow: "auto",
                    mb: 2,
                  },
                  "& pre code": {
                    backgroundColor: "transparent",
                    padding: 0,
                    color: "inherit",
                  },
                }}
              />
            ) : (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                No description available.
              </Typography>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box
            sx={{
              height: "calc(100vh - 400px)",
              minHeight: 500,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SubmoduleComments
              comments={comments}
              newComment={newComment}
              submittingComment={submittingComment}
              selectedContentId={selectedContentId}
              onCommentChange={onCommentChange}
              onSubmitComment={onSubmitComment}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}

