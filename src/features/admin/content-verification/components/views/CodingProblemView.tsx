import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import AppEditor from "../../../../../commonComponents/editor/AppEditor";
import { CodingProblemDetails, LANGUAGE_OPTIONS } from "../../types";

interface CodingProblemViewProps {
  details: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const CodingProblemView: React.FC<CodingProblemViewProps> = ({ details }) => {
  const problemDetails = details as CodingProblemDetails;
  const [tabValue, setTabValue] = useState(0);

  // Normalize language key for matching
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  // Get available languages from template_code
  const availableLanguages = useMemo(() => {
    if (!problemDetails.template_code) return LANGUAGE_OPTIONS;

    const templateKeys = Object.keys(problemDetails.template_code);
    const matchedLanguages = LANGUAGE_OPTIONS.filter((lang) => {
      const normalizedLang = normalizeKey(lang.value);
      return templateKeys.some((key) => {
        const normalizedKey = normalizeKey(key);
        return (
          normalizedKey === normalizedLang ||
          normalizedKey.includes(normalizedLang) ||
          normalizedLang.includes(normalizedKey)
        );
      });
    });

    return matchedLanguages.length > 0 ? matchedLanguages : LANGUAGE_OPTIONS;
  }, [problemDetails.template_code]);

  // Set default language to first available or first option
  const defaultLanguage = useMemo(() => {
    if (!problemDetails.template_code) return "javascript";

    const templateKeys = Object.keys(problemDetails.template_code);
    if (templateKeys.length === 0) return "javascript";

    // Try to match with available languages
    for (const lang of LANGUAGE_OPTIONS) {
      const normalizedLang = normalizeKey(lang.value);
      const matchingKey = templateKeys.find((key) => {
        const normalizedKey = normalizeKey(key);
        return (
          normalizedKey === normalizedLang ||
          normalizedKey.includes(normalizedLang) ||
          normalizedLang.includes(normalizedKey)
        );
      });
      if (matchingKey) {
        return lang.value;
      }
    }

    // Fallback to first language option
    return LANGUAGE_OPTIONS[0]?.value || "javascript";
  }, [problemDetails.template_code]);

  const [selectedLanguage, setSelectedLanguage] =
    useState<string>(defaultLanguage);
  const [code, setCode] = useState<string>("");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorHeight, setEditorHeight] = useState<number>(600);
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Helper to get template string for a given language
  const getTemplateForLanguage = useCallback(
    (lang: string): string => {
      if (!problemDetails.template_code) return "";

      const keys = Object.keys(problemDetails.template_code);
      if (keys.length === 0) return "";

      const normalizedLang = normalizeKey(lang);

      // Try exact match first
      let matchingKey = keys.find((key) => {
        const normalizedKey = normalizeKey(key);
        return normalizedKey === normalizedLang;
      });

      // Try partial match
      if (!matchingKey) {
        matchingKey = keys.find((key) => {
          const normalizedKey = normalizeKey(key);
          return (
            normalizedKey.includes(normalizedLang) ||
            normalizedLang.includes(normalizedKey)
          );
        });
      }

      // Fallback to first key
      if (!matchingKey) {
        matchingKey = keys[0];
      }

      const templateCode = problemDetails.template_code[matchingKey];
      return templateCode && typeof templateCode === "string"
        ? templateCode
        : "";
    },
    [problemDetails.template_code]
  );

  // Initialize code when template_code or language changes
  useEffect(() => {
    if (problemDetails.template_code && selectedLanguage) {
      const template = getTemplateForLanguage(selectedLanguage);
      if (template) {
        setCode(template);
      }
    }
  }, [problemDetails.template_code, selectedLanguage, getTemplateForLanguage]);

  // Update selected language when default changes
  useEffect(() => {
    if (defaultLanguage && defaultLanguage !== selectedLanguage) {
      setSelectedLanguage(defaultLanguage);
    }
  }, [defaultLanguage, selectedLanguage]);

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value;
    setSelectedLanguage(newLang);
    // Update code when language changes
    const template = getTemplateForLanguage(newLang);
    if (template) {
      setCode(template);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCodeChange = (value: string | undefined) => {
    // Read-only, but we keep the handler for compatibility
    if (value !== undefined) {
      // Do nothing - read-only mode
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Set editor to read-only
    editor.updateOptions({ readOnly: true });

    // Set the code value when editor is ready
    if (code) {
      const model = editor.getModel();
      if (model) {
        model.setValue(code);
      }
    }
  };

  // Update editor value when code changes
  useEffect(() => {
    if (isEditorReady && editorRef.current && code) {
      const model = editorRef.current.getModel();
      if (model) {
        const currentValue = model.getValue();
        if (currentValue !== code) {
          model.setValue(code);
        }
      }
    }
  }, [code, isEditorReady]);

  // Calculate editor height based on container
  useEffect(() => {
    const updateHeight = () => {
      if (editorContainerRef.current) {
        const rect = editorContainerRef.current.getBoundingClientRect();
        setEditorHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "var(--success-500)";
      case "medium":
        return "var(--warning-500)";
      case "hard":
        return "var(--error-500)";
      default:
        return "var(--neutral-600)";
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: 2,
        height: "calc(100vh - 200px)",
        minHeight: 0,
      }}
    >
      {/* Left Panel - Problem Description */}
      <Paper
        sx={{
          border: "1px solid var(--neutral-200)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "var(--neutral-100)",
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
          {/* Title and Difficulty */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--font-primary)",
                mb: 1,
              }}
            >
              {problemDetails.title}
            </Typography>
            <Chip
              label={problemDetails.difficulty_level}
              size="small"
              sx={{
                bgcolor: getDifficultyColor(problemDetails.difficulty_level),
                color: "white",
                fontWeight: 600,
                border: `1px solid ${getDifficultyColor(
                  problemDetails.difficulty_level
                )}`,
              }}
            />
          </Box>

          {/* Problem Statement */}
          <Box sx={{ mb: 3 }}>
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
                  fontFamily: "monospace",
                },
                "& code": {
                  bgcolor: "var(--neutral-100)",
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontFamily: "monospace",
                },
                "& p": {
                  mb: 2,
                },
                "& ul, & ol": {
                  pl: 3,
                  mb: 2,
                },
              }}
              dangerouslySetInnerHTML={{
                __html: problemDetails.problem_statement,
              }}
            />
          </Box>

          {/* Sample Input/Output */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 2,
              }}
            >
              Examples
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "var(--neutral-50)",
                  border: "1px solid var(--neutral-200)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--font-secondary)",
                    mb: 1,
                  }}
                >
                  Input:
                </Typography>
                <Box
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    bgcolor: "var(--neutral-100)",
                    p: 1.5,
                    borderRadius: 0.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: problemDetails.sample_input,
                  }}
                />
              </Paper>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "var(--neutral-50)",
                  border: "1px solid var(--neutral-200)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--font-secondary)",
                    mb: 1,
                  }}
                >
                  Output:
                </Typography>
                <Box
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    bgcolor: "var(--neutral-100)",
                    p: 1.5,
                    borderRadius: 0.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: problemDetails.sample_output,
                  }}
                />
              </Paper>
            </Box>
          </Box>

          {/* Constraints */}
          {problemDetails.constraints && (
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  mb: 2,
                }}
              >
                Constraints
              </Typography>
              <Box
                sx={{
                  "& ul, & ol": {
                    pl: 3,
                  },
                  "& code": {
                    bgcolor: "var(--neutral-100)",
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontFamily: "monospace",
                  },
                }}
                dangerouslySetInnerHTML={{ __html: problemDetails.constraints }}
              />
            </Box>
          )}

          {/* Tags */}
          {problemDetails.tags && (
            <Box>
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  mb: 2,
                }}
              >
                Topics
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {problemDetails.tags.split(",").map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag.trim()}
                    size="small"
                    sx={{
                      bgcolor: "var(--neutral-100)",
                      color: "var(--font-primary)",
                      fontWeight: 500,
                      border: "1px solid var(--neutral-300)",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Right Panel - Code Editor */}
      <Paper
        sx={{
          border: "1px solid var(--neutral-200)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Language Selector */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid var(--neutral-200)",
            bgcolor: "var(--neutral-50)",
            flexShrink: 0,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              label="Language"
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Code Editor */}
        <Box
          ref={editorContainerRef}
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            position: "relative",
          }}
        >
          {code && selectedLanguage ? (
            <AppEditor
              height={editorHeight}
              language={
                selectedLanguage === "python3"
                  ? "python"
                  : selectedLanguage === "c++"
                  ? "cpp"
                  : selectedLanguage || "javascript"
              }
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              onMount={handleEditorDidMount}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                color: "var(--font-secondary)",
              }}
            >
              <Typography>Loading template code...</Typography>
            </Box>
          )}
        </Box>

        {/* Test Cases Tab */}
        {problemDetails.test_cases && problemDetails.test_cases.length > 0 && (
          <Box
            sx={{
              borderTop: "1px solid var(--neutral-200)",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: "var(--neutral-200)" }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Test Cases" />
              </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  maxHeight: "200px",
                  overflow: "auto",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "var(--neutral-100)",
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
                {problemDetails.test_cases.map((testCase, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: "var(--neutral-50)",
                      borderRadius: 1,
                      border: "1px solid var(--neutral-200)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        mb: 1,
                      }}
                    >
                      Test Case {index + 1}
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--font-secondary)",
                            mb: 0.5,
                          }}
                        >
                          Input:
                        </Typography>
                        <Box
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.8125rem",
                            bgcolor: "var(--neutral-100)",
                            p: 1,
                            borderRadius: 0.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                          dangerouslySetInnerHTML={{ __html: testCase.input }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--font-secondary)",
                            mb: 0.5,
                          }}
                        >
                          Expected Output:
                        </Typography>
                        <Box
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.8125rem",
                            bgcolor: "var(--neutral-100)",
                            p: 1,
                            borderRadius: 0.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                          dangerouslySetInnerHTML={{
                            __html:
                              testCase.output || testCase.expected_output || "",
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </TabPanel>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CodingProblemView;
