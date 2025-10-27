import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import { X, Plus, Info } from "lucide-react";

interface TrackingField {
  label: string;
  key: string;
  placeholder: string;
  description: string;
}

interface SessionTrackingData {
  topicsCovered: string;
  assignmentsGiven: string;
  handsOnCoding: string;
  additionalComments: string;
}

interface SessionTrackingModalProps {
  open: boolean;
  onClose: () => void;
  activityName: string;
  activityId: number;
  onSave?: (data: SessionTrackingData) => void;
  initialData?: {
    topic_covered?: string | null;
    assignments_given?: string | null;
    hands_on_coding?: string | null;
    additional_comments?: string | null;
  };
}

const trackingFields: TrackingField[] = [
  {
    label: "Topics Covered",
    key: "topicsCovered",
    placeholder: "Enter topics covered...",
    description:
      "Session-wise recording of topics covered by the trainer for transparency and reference.",
  },
  {
    label: "Assignments Given",
    key: "assignmentsGiven",
    placeholder: "Enter assignments given...",
    description:
      "List of daily or session-based assignments given to students, linked with LMS submission tracking.",
  },
  {
    label: "Hands-on Coding Involved",
    key: "handsOnCoding",
    placeholder: "Enter hands-on coding details...",
    description:
      "Capture details of practical coding sessions, labs, or exercises performed during the session.",
  },
  {
    label: "Additional Comments",
    key: "additionalComments",
    placeholder: "Enter additional comments...",
    description:
      "Trainers can add qualitative remarks on class participation, doubts raised, or key observations.",
  },
];

const SessionTrackingModal: React.FC<SessionTrackingModalProps> = ({
  open,
  onClose,
  activityName,
  onSave,
  initialData,
}) => {
  // topicsCovered is mandatory and expanded by default
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set(["topicsCovered"]));
  const [formData, setFormData] = useState<SessionTrackingData>({
    topicsCovered: initialData?.topic_covered || "",
    assignmentsGiven: initialData?.assignments_given || "",
    handsOnCoding: initialData?.hands_on_coding || "",
    additionalComments: initialData?.additional_comments || "",
  });

  // Update form data when initialData changes
  React.useEffect(() => {
    if (open && initialData) {
      setFormData({
        topicsCovered: initialData?.topic_covered || "",
        assignmentsGiven: initialData?.assignments_given || "",
        handsOnCoding: initialData?.hands_on_coding || "",
        additionalComments: initialData?.additional_comments || "",
      });
      
      // Expand fields that have existing data
      const fieldsToExpand = new Set<string>(["topicsCovered"]);
      if (initialData?.assignments_given) fieldsToExpand.add("assignmentsGiven");
      if (initialData?.hands_on_coding) fieldsToExpand.add("handsOnCoding");
      if (initialData?.additional_comments) fieldsToExpand.add("additionalComments");
      setExpandedFields(fieldsToExpand);
    }
  }, [open, initialData]);

  const toggleField = (key: string) => {
    setExpandedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    handleClose();
  };

  const handleClose = () => {
    setExpandedFields(new Set(["topicsCovered"]));
    setFormData({
      topicsCovered: "",
      assignmentsGiven: "",
      handsOnCoding: "",
      additionalComments: "",
    });
    onClose();
  };

  const handleCancel = (key: string) => {
    setExpandedFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    handleInputChange(key, "");
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 49, 83, 0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #E6F0FF",
          pb: 2,
          pt: 3,
          px: 3,
        }}
      >
        <div>
          <h2 className="text-xl font-bold text-[var(--primary-500)] mb-1">
            Session Tracking
          </h2>
          <p className="text-sm text-gray-600 font-normal">
            {activityName}
          </p>
        </div>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: "#5D77A6",
            "&:hover": { backgroundColor: "#F0F8FF" },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <div className="space-y-3">
          {trackingFields.map((field) => (
            <div
              key={field.key}
              className="border border-[var(--primary-100)] rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
            >
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--primary-600)]">
                    {field.label}
                  </span>
                  <Tooltip
                    title={field.description}
                    placement="top"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#003153",
                          fontSize: "12px",
                          maxWidth: "300px",
                          padding: "8px 12px",
                          "& .MuiTooltip-arrow": {
                            color: "#003153",
                          },
                        },
                      },
                    }}
                  >
                    <div className="cursor-help">
                      <Info size={16} className="text-gray-400" />
                    </div>
                  </Tooltip>
                </div>
                {/* Topics Covered is mandatory; don't show Add button for it */}
                {!expandedFields.has(field.key) && field.key !== "topicsCovered" && (
                  <button
                    onClick={() => toggleField(field.key)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--primary-500)] bg-[var(--primary-50)] hover:bg-[var(--primary-100)] rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                )}
              </div>

              {(expandedFields.has(field.key) || field.key === "topicsCovered") && (
                <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                  <textarea
                    value={formData[field.key as keyof SessionTrackingData]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-300)] focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleCancel(field.key)}
                      className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => toggleField(field.key)}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-[var(--primary-500)] hover:bg-[var(--primary-600)] rounded-lg transition-colors"
                      disabled={field.key === "topicsCovered" && !formData.topicsCovered.trim()}
                    >
                      Save Field
                    </button>
                  </div>
                </div>
              )}

              {!expandedFields.has(field.key) &&
                formData[field.key as keyof SessionTrackingData] && (
                  <div className="mt-2 p-3 bg-[#F0F8FF] rounded-lg text-xs text-gray-700 border border-[var(--primary-100)]">
                    {formData[field.key as keyof SessionTrackingData]}
                  </div>
                )}
            </div>
          ))}
        </div>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: "1px solid #E6F0FF",
          px: 3,
          py: 2.5,
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: "#D3E3F2",
            color: "#5D77A6",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              borderColor: "#B0C4DE",
              backgroundColor: "#F0F8FF",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.topicsCovered.trim()}
          sx={{
            backgroundColor: "var(--primary-500)",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0, 49, 83, 0.15)",
            "&:hover": {
              backgroundColor: "var(--primary-600)",
              boxShadow: "0 4px 12px rgba(0, 49, 83, 0.2)",
            },
            "&.Mui-disabled": {
              backgroundColor: "#B9D6F3",
              color: "#F8FCFF",
              boxShadow: "none",
            },
          }}
        >
          Save Tracking
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTrackingModal;
