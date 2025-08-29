import { useMutation } from "@tanstack/react-query";
import { addVoteOnThread } from "../../../services/community/threadApis";
import { VoteType } from "../types";
import { useToast } from "../../../contexts/ToastContext";
import { ArrowDown, ArrowUp } from "lucide-react";
import { addVoteOnComment } from "../../../services/community/commentApis";

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
  return (
    <div
      className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => handleVote(VoteType.Upvote)}
        className={`p-1.5 sm:p-2 rounded-md transition-colors text-orange-600 hover:bg-orange-50`}
      >
        <ArrowUp size={16} className="sm:w-4 sm:h-4" />
      </button>
      <div className="flex flex-col items-center text-xs sm:text-sm font-semibold">
        <span
          className={`${
            upvote - downvote > 0 ? "text-orange-600" : "text-blue-600"
          } px-1.5 sm:px-2 py-0.5`}
        >
          {upvote - downvote}
        </span>
      </div>
      <button
        onClick={() => handleVote(VoteType.Downvote)}
        className={`p-1.5 sm:p-2 rounded-md transition-colors text-blue-600 hover:bg-blue-50`}
      >
        <ArrowDown size={16} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

export default VoteCard;
