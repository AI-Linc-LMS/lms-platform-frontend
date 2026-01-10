"use client";

import { Box, Typography } from "@mui/material";
import {
  ContentDetail,
  SubModuleContentItem,
} from "@/lib/services/courses.service";
import { ContentMarksInfo } from "./ContentMarksInfo";
import { VideoContent } from "./VideoContent";
import { QuizContent } from "./QuizContent";
import { CodingProblemLayout } from "@/components/coding/CodingProblemLayout";
import { AssignmentContent } from "./AssignmentContent";
import { ArticleContent } from "./ArticleContent";
import { VideoTabs } from "./VideoTabs";

interface SubmoduleContentViewerProps {
  content: ContentDetail;
  currentItem: SubModuleContentItem | undefined;
  courseId: number;
  isFirstVideoView: boolean;
  videoCanSeek: boolean;
  pastSubmissions: any[];
  loadingSubmissions: boolean;
  comments?: any[];
  newComment?: string;
  submittingComment?: boolean;
  onVideoStart: () => void;
  onVideoComplete?: () => void;
  onStartQuiz: () => void;
  onQuizComplete?: () => void;
  onStartAssignment: () => void;
  onCodeChange?: (value: string | undefined) => void;
  onResetCode?: () => void;
  onSubmitCode?: () => void;
  onArticleComplete?: () => void;
  onCommentChange?: (value: string) => void;
  onSubmitComment?: () => void;
}

export function SubmoduleContentViewer({
  content,
  currentItem,
  courseId,
  isFirstVideoView,
  videoCanSeek,
  pastSubmissions,
  loadingSubmissions,
  comments = [],
  newComment = "",
  submittingComment = false,
  onVideoStart,
  onVideoComplete,
  onStartQuiz,
  onQuizComplete,
  onStartAssignment,
  onArticleComplete,
  onCommentChange,
  onSubmitComment,
}: SubmoduleContentViewerProps) {
  // For coding problems, don't show header as the layout handles it internally
  const isCodingProblem = content.content_type === "CodingProblem";

  return (
    <Box>
      {!isCodingProblem && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#1a1f2e",
              mb: 1,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
            }}
          >
            {content.content_title}
          </Typography>
          {/* Marks and Progress Info */}
          {currentItem && currentItem.marks > 0 && (
            <ContentMarksInfo
              marks={currentItem.marks}
              obtainedMarks={currentItem.obtainedMarks ?? null}
              submissions={currentItem.submissions ?? 0}
            />
          )}
        </Box>
      )}

      {/* Video Content */}
      {content.content_type === "VideoTutorial" &&
        content.details?.video_url && (
          <>
            <VideoContent
              content={content}
              contentId={content.id}
              isFirstVideoView={isFirstVideoView}
              videoCanSeek={videoCanSeek}
              onVideoStart={onVideoStart}
              onVideoComplete={onVideoComplete}
            />
            <VideoTabs
              content={content}
              comments={comments}
              newComment={newComment}
              submittingComment={submittingComment}
              selectedContentId={content.id}
              onCommentChange={onCommentChange || (() => {})}
              onSubmitComment={onSubmitComment || (() => {})}
            />
          </>
        )}

      {/* Quiz Content */}
      {content.content_type === "Quiz" && (
        <QuizContent
          content={content}
          courseId={courseId}
          pastSubmissions={pastSubmissions}
          loadingSubmissions={loadingSubmissions}
          onStartQuiz={onStartQuiz}
          onQuizComplete={onQuizComplete}
        />
      )}

      {/* Coding Problem Content */}
      {content.content_type === "CodingProblem" && (
        <CodingProblemLayout
          key={content.id}
          courseId={courseId}
          contentId={content.id}
          problemData={content}
          onComplete={onQuizComplete}
          marks={currentItem?.marks}
          obtainedMarks={currentItem?.obtainedMarks}
          allowResize={true}
        />
      )}

      {/* Assignment Content */}
      {content.content_type === "Assignment" && (
        <AssignmentContent
          content={content}
          courseId={courseId}
          onStartAssignment={onStartAssignment}
        />
      )}

      {/* Article Content */}
      {content.content_type === "Article" && (
        <ArticleContent
          content={content}
          courseId={courseId}
          onArticleComplete={onArticleComplete}
        />
      )}
    </Box>
  );
}
