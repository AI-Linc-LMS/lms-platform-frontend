import { Box, Typography, Paper, Chip } from "@mui/material";
import { QuizDetails } from "../../types";

interface QuizViewProps {
  details: any;
}

const QuizView: React.FC<QuizViewProps> = ({ details }) => {
  const quizDetails = details as QuizDetails;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        sx={{
          p: 3,
          border: "1px solid var(--neutral-200)",
        }}
      >
        {/* Instructions */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--font-primary)",
              mb: 2,
            }}
          >
            Instructions
          </Typography>
          <Paper
            sx={{
              p: 2,
              bgcolor: "var(--neutral-50)",
            }}
          >
            <Typography sx={{ fontSize: "0.875rem" }}>
              {quizDetails.instructions}
            </Typography>
          </Paper>
        </Box>

        {/* Quiz Info */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--font-secondary)",
                mb: 1,
              }}
            >
              Duration
            </Typography>
            <Chip
              label={`${quizDetails.durating_in_minutes} minutes`}
              size="small"
              sx={{
                bgcolor: "var(--primary-100)",
                color: "var(--primary-700)",
              }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--font-secondary)",
                mb: 1,
              }}
            >
              Difficulty
            </Typography>
            <Chip
              label={quizDetails.difficulty_level}
              size="small"
              sx={{
                bgcolor: "var(--primary-100)",
                color: "var(--primary-700)",
              }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--font-secondary)",
                mb: 1,
              }}
            >
              Total Questions
            </Typography>
            <Chip
              label={quizDetails.mcqs?.length || 0}
              size="small"
              sx={{
                bgcolor: "var(--primary-100)",
                color: "var(--primary-700)",
              }}
            />
          </Box>
        </Box>

        {/* Questions */}
        {quizDetails.mcqs && quizDetails.mcqs.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 2,
              }}
            >
              Questions
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                maxHeight: "600px",
                overflow: "auto",
                pr: 2,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  bgcolor: "var(--neutral-100)",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "var(--neutral-300)",
                  borderRadius: "4px",
                  "&:hover": {
                    bgcolor: "var(--neutral-400)",
                  },
                },
              }}
            >
              {quizDetails.mcqs.map((mcq, index) => (
                <Paper
                  key={mcq.id}
                  sx={{
                    p: 3,
                    border: "1px solid var(--neutral-200)",
                    bgcolor: "var(--card-bg)",
                  }}
                >
                  {/* Question */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                        color: "var(--font-primary)",
                        mb: 1,
                      }}
                    >
                      {index + 1}.
                    </Typography>
                    <Box
                      sx={{
                        "& img": {
                          maxWidth: "100%",
                          height: "auto",
                        },
                        "& pre": {
                          bgcolor: "var(--neutral-100)",
                          p: 2,
                          borderRadius: 1,
                          overflow: "auto",
                        },
                        "& code": {
                          bgcolor: "var(--neutral-100)",
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontFamily: "monospace",
                        },
                      }}
                      dangerouslySetInnerHTML={{ __html: mcq.question_text }}
                    />
                  </Box>

                  {/* Options */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, ml: 2 }}>
                    {mcq.options.map((option, optIndex) => {
                      const optionLetter = String.fromCharCode(65 + optIndex);
                      const isCorrect = optionLetter === mcq.correct_option;

                      return (
                        <Paper
                          key={optIndex}
                          sx={{
                            p: 1.5,
                            bgcolor: isCorrect
                              ? "var(--success-50)"
                              : "var(--neutral-50)",
                            border: `2px solid ${
                              isCorrect
                                ? "var(--success-500)"
                                : "var(--neutral-200)"
                            }`,
                            borderRadius: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: isCorrect ? 700 : 600,
                                color: isCorrect
                                  ? "var(--success-700)"
                                  : "var(--font-primary)",
                                minWidth: "24px",
                              }}
                            >
                              {optionLetter})
                            </Typography>
                            <Box
                              sx={{
                                flex: 1,
                                fontSize: "0.875rem",
                                color: isCorrect
                                  ? "var(--success-700)"
                                  : "var(--font-primary)",
                                fontWeight: isCorrect ? 600 : 400,
                                "& img": {
                                  maxWidth: "100%",
                                  height: "auto",
                                },
                                "& pre": {
                                  bgcolor: "var(--neutral-100)",
                                  p: 1,
                                  borderRadius: 0.5,
                                  overflow: "auto",
                                },
                                "& code": {
                                  bgcolor: "var(--neutral-100)",
                                  px: 0.5,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  fontFamily: "monospace",
                                },
                              }}
                              dangerouslySetInnerHTML={{ __html: option }}
                            />
                            {isCorrect && (
                              <Chip
                                label="Correct"
                                size="small"
                                sx={{
                                  height: "20px",
                                  bgcolor: "var(--success-600)",
                                  color: "white",
                                  fontSize: "0.75rem",
                                }}
                              />
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>

                  {/* Explanation */}
                  {mcq.explanation && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--neutral-200)" }}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--font-secondary)",
                          mb: 1,
                        }}
                      >
                        Explanation:
                      </Typography>
                      <Box
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--font-secondary)",
                          "& img": {
                            maxWidth: "100%",
                            height: "auto",
                          },
                          "& pre": {
                            bgcolor: "var(--neutral-100)",
                            p: 1.5,
                            borderRadius: 0.5,
                            overflow: "auto",
                          },
                          "& code": {
                            bgcolor: "var(--neutral-100)",
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontFamily: "monospace",
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: mcq.explanation }}
                      />
                    </Box>
                  )}

                  {/* Difficulty Badge */}
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`Difficulty: ${mcq.difficulty_level}`}
                      size="small"
                      sx={{
                        bgcolor: "var(--neutral-100)",
                        color: "var(--font-secondary)",
                      }}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default QuizView;


