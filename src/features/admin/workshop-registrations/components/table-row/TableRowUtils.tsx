export const FIRST_CALL_STATUS_OPTIONS = [
  { value: "Connected, scheduled interview", color: "bg-green-500" },
  { value: "Connected, denied interview", color: "bg-red-500" },
  { value: "Couldn't Connect", color: "bg-yellow-400" },
  { value: "Call back requested", color: "bg-green-500" },
  { value: "N/A", color: "bg-gray-400" },
];

export const SECOND_CALL_STATUS_OPTIONS = [
  { value: "Converted", color: "bg-green-500" },
  { value: "Follow-up needed", color: "bg-yellow-400" },
  { value: "Denied", color: "bg-red-500" },
  { value: "N/A", color: "bg-gray-400" },
];

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const truncateComment = (comment: string, maxLength: number = 25) => {
  if (!comment) return "N/A";
  return comment.length > maxLength
    ? `${comment.substring(0, maxLength)}...`
    : comment;
};

export const getStatusBadgeClass = (
  status: string,
  type: "true/false" | "call" | "payment"
) => {
  if (type === "true/false") {
    if (status === "true" || status === "paid" || status === "attempted") {
      return "bg-green-500 text-white";
    }
    if (
      status === "no" ||
      status === "not_paid" ||
      status === "not_attempted"
    ) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-600";
  }
  if (type === "payment") {
    if (status === "true" || status === "paid") {
      return "bg-green-500 text-white";
    }
    if (status === "partially_paid") {
      return "bg-orange-500 text-white";
    }
    if (status === "false" || status === "not_paid" || status === "no") {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-600";
  }
  if (type === "call") {
    if (
      status === "Connected, scheduled interview" ||
      status === "Call back requested" ||
      status === "Converted"
    )
      return "bg-green-100 text-green-800";
    if (status === "Couldn't Connect" || status === "Follow-up needed")
      return "bg-yellow-100 text-yellow-800";
    if (status === "Connected, denied interview" || status === "Denied")
      return "bg-red-100 text-red-800";
    if (status === "N/A") return "bg-gray-100 text-gray-600";
    return "bg-gray-100 text-gray-600";
  }
  return "bg-gray-100 text-gray-600";
};

export const getAmountColor = (amount: string | number | null | undefined) => {
  if (!amount || amount === "N/A" || amount === 0 || amount === "0") {
    return "bg-gray-100 text-gray-600";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (numAmount > 0) {
    return "bg-green-100 text-green-800";
  }

  return "bg-gray-100 text-gray-600";
};

export const getStatusColor = (value: string, type: "first" | "second") => {
  const options =
    type === "first" ? FIRST_CALL_STATUS_OPTIONS : SECOND_CALL_STATUS_OPTIONS;
  const found = options.find((opt) => opt.value === value);
  return found ? found.color : "bg-gray-300";
};
