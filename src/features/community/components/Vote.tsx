import { useMutation } from "@tanstack/react-query";
import { addVoteOnThread } from "../../../services/community/threadApis";
import { VoteType } from "../types";
import { useToast } from "../../../contexts/ToastContext";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { addVoteOnComment } from "../../../services/community/commentApis";
import { useState } from "react";

interface VoteCardProps {
  threadId: number;
  commentId?: number;
  Vote: "thread" | "comment";
  refetch: () => void;
  upvote: number;
  downvote: number;
}

const VoteCard: React.FC<VoteCardProps> = ({
  threadId,
  commentId,
  Vote,
  refetch,
  upvote,
  downvote,
}: VoteCardProps) => {
  const { error: showError } = useToast();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [isAnimating, setIsAnimating] = useState(false);
  const upVoteToThreadMutation = useMutation({
    mutationFn: (type: VoteType) => addVoteOnThread(clientId, threadId, type),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to upvote thread:", error);
      showError(
        "Failed to upvote",
        "There was an error processing your vote. Please try again."
      );
    },
  });

  const addVoteOnCommentMutation = useMutation({
    mutationFn: (type: VoteType) =>
      addVoteOnComment(clientId, threadId, commentId ?? 0, type),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to vote on comment:", error);
      showError(
        "Failed to vote",
        "There was an error processing your vote on the comment."
      );
    },
  });

  const handleVote = (type: VoteType): void => {
    if (Vote === "thread") upVoteToThreadMutation.mutate(type);
    else addVoteOnCommentMutation.mutate(type);
  };

  const handleClick = (type: VoteType) => {
    setIsAnimating(true);
    handleVote(type);
    setTimeout(() => setIsAnimating(false), 300); // reset animation after 300ms
  };
  return (
    <div className="flex flex-col items-center">
      {/* Upvote button + count */}
      <button
        onClick={() => handleClick(VoteType.Upvote)}
        className={`p-1.5 sm:p-2 rounded-md transition-colors text-orange-600 hover:bg-orange-50 flex flex-col items-center`}
      >
        <ThumbsUpIcon
          size={16}
          className={`sm:w-4 sm:h-4 transition-transform duration-200 ${
            isAnimating ? "scale-125" : "scale-100"
          }`}
        />
        <span className="text-xs sm:text-sm font-semibold text-orange-600 mt-1">
          {upvote}
        </span>
      </button>

      {/* Divider or spacing */}
      <div className="h-2" />

      {/* Downvote button + count */}
      <button
        onClick={() => handleVote(VoteType.Downvote)}
        className="p-1.5 sm:p-2 rounded-md transition-colors text-blue-600 hover:bg-blue-50 flex flex-col items-center"
      >
        <ThumbsDownIcon size={16} className="sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-semibold text-blue-600 mt-1">
          {downvote}
        </span>
      </button>
    </div>
  );
};

export default VoteCard;
