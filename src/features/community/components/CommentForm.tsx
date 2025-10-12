import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Info,
  Send,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { useTranslation } from "react-i18next";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent("");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <MessageCircle className="text-[var(--font-light)]" size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("community.commentForm.title")}
              </h3>
              <p className="text-sm text-gray-500">
                {t("community.commentForm.subtitle")}
              </p>
            </div>
          </div>
          {showForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Editor */}
      {showForm && (
        <div className="p-4 sm:p-6">
          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-gray-600 text-sm">
              {t("community.commentForm.formatHelp.title")}
            </p>
            <ul className="text-gray-600 text-sm list-disc pl-5">
              <li>{t("community.commentForm.formatHelp.code")}</li>
              <li>{t("community.commentForm.formatHelp.images")}</li>
              <li>{t("community.commentForm.formatHelp.text")}</li>
              <li>{t("community.commentForm.formatHelp.links")}</li>
            </ul>
          </div>

          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={t("community.commentForm.placeholder")}
            height="h-64 sm:h-96"
          />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info size={16} />
              <span>{t("community.commentForm.visibleInfo")}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-blue-600 text-[var(--font-light)] px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("community.commentForm.posting")}</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{t("community.commentForm.post")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentForm;
