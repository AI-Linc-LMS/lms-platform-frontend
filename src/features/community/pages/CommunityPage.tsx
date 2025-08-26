import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  Menu,
  Plus,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { CreateThread, Thread } from "../types";
import ThreadCard from "../components/ThreadCard";
import RichTextEditor from "../components/RichTextEditor";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "../../../contexts/ToastContext";
import {
  createThread,
  getAllThreads,
  getAllTags,
  updateThread,
  deleteThread,
} from "../../../services/community/threadApis";
import {
  addBookmark,
  removeBookmark,
} from "../../../services/community/commentApis";

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const user = useSelector((state: RootState) => state.user);
  const [threads, setThreads] = useState<Thread[]>([]);
  const { success, error: showError } = useToast();

  const { data, isLoading, error, refetch } = useQuery<Thread[]>({
    queryKey: ["threads", clientId],
    queryFn: () => getAllThreads(clientId),
    retry: 2,
    retryDelay: 1000,
  });

  const { data: tagsData } = useQuery<string[]>({
    queryKey: ["tags", clientId],
    queryFn: () => getAllTags(clientId),
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (data) {
      setThreads(data);
    }
  }, [data]);

  const createThreadMutation = useMutation({
    mutationFn: (newThread: CreateThread) => createThread(clientId, newThread),
    onSuccess: () => {
      setShowNewThreadForm(false);
      refetch();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      console.error("Failed to create thread:", error);
      showError(
        "Failed to create thread",
        "There was an error creating your thread. Please try again."
      );
    },
  });

  const updateThreadMutation = useMutation({
    mutationFn: (variables: {
      threadId: string;
      threadData: Partial<CreateThread>;
    }) => updateThread(clientId, variables.threadId, variables.threadData),
    onSuccess: () => {
      setShowNewThreadForm(false);
      refetch();
    },
    onError: (error) => {
      console.error("Failed to update thread:", error);
      showError(
        "Failed to update thread",
        "There was an error updating your thread. Please try again."
      );
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => deleteThread(clientId, threadId),
    onSuccess: (_, threadId) => {
      setThreads((prev) =>
        prev.filter((thread) => thread.id.toString() !== threadId)
      );
      success("Thread deleted", "The thread has been deleted successfully.");
      setShowDeleteConfirm(null);
    },
    onError: (error) => {
      console.error("Failed to delete thread:", error);
      showError(
        "Failed to delete thread",
        "There was an error deleting the thread. Please try again."
      );
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [editingThread, setEditingThread] = useState<Thread | null>(null);
  const [newThread, setNewThread] = useState({
    title: "",
    body: "",
    tags: "",
  });
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(
    new Set()
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: "thread" | "answer";
    id: number;
  } | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const threadsPerPage = 10;

  const allTags =
    tagsData || Array.from(new Set(threads.flatMap((thread) => thread.tags)));

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || thread.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredThreads.length / threadsPerPage);
  const startIndex = (currentPage - 1) * threadsPerPage;
  const endIndex = startIndex + threadsPerPage;
  const currentThreads = filteredThreads.slice(startIndex, endIndex);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTag]);

  const handleThreadClick = (threadId: number) => {
    navigate(`/community/thread/${threadId}`);
  };

  const toggleThreadExpansion = (threadId: number): void => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const addBookmarkMutation = useMutation({
    mutationFn: (threadId: number) => addBookmark(clientId, threadId),
    onError: (error) => {
      console.error("Failed to add bookmark:", error);
      showError(
        "Failed to bookmark",
        "There was an error bookmarking this thread."
      );
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (threadId: number) => removeBookmark(clientId, threadId),
    onError: (error) => {
      console.error("Failed to remove bookmark:", error);
      showError(
        "Failed to remove bookmark",
        "There was an error removing the bookmark."
      );
    },
  });

  const toggleBookmark = (threadId: number): void => {
    if (isBookmarked[threadId]) {
      removeBookmarkMutation.mutate(threadId);
    } else {
      addBookmarkMutation.mutate(threadId);
    }
    setIsBookmarked((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
    refetch();
  };

  const handleCreateThread = (): void => {
    if (!newThread.title.trim()) {
      showError("Title required", "Please enter a title for your thread.");
      return;
    }

    if (!newThread.body.trim()) {
      showError("Content required", "Please add some content to your thread.");
      return;
    }

    if (editingThread) {
      // Update existing thread
      updateThreadMutation.mutate({
        threadId: editingThread.id.toString(),
        threadData: {
          title: newThread.title.trim(),
          body: newThread.body.trim(),
          tags: newThread.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        },
      });
    } else {
      // Create new thread
      createThreadMutation.mutate({
        title: newThread.title.trim(),
        body: newThread.body.trim(),
        tags: newThread.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      });
    }
  };

  const handleEditThread = (thread: Thread): void => {
    setEditingThread(thread);
    setShowNewThreadForm(true);
  };

  const handleCancelEdit = (): void => {
    setEditingThread(null);
    setNewThread({ title: "", body: "", tags: "" });
    setShowNewThreadForm(false);
  };

  const handleDeleteThread = (threadId: number): void => {
    deleteThreadMutation.mutate(threadId.toString());
  };

  const canEdit = (author: string): boolean => {
    return user.username === author || user.full_name === author;
  };

  useEffect(() => {
    setExpandedThreads(new Set());
    setShowMobileMenu(false);
    setShowMobileFilters(false);
  }, [location.pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <Users className="text-white" size={16} />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Community
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading community threads...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <Users className="text-white" size={16} />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Community
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-red-200 rounded-lg p-8">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Failed to load community
              </h2>
              <p className="text-gray-600 mb-6">
                There was an error loading the community threads. Please try
                again.
              </p>
              <button
                onClick={() => refetch()}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Coming Soon Popup */}
      {showComingSoonPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl mx-4 transform animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Coming Soon!
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're working hard to bring you an amazing community experience.
                Stay tuned for discussions, Q&A, and collaborative learning
                features.
              </p>
              <button
                onClick={() => {
                  setShowComingSoonPopup(false);
                  navigate("/");
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete {showDeleteConfirm.type}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Are you sure you want to delete this {showDeleteConfirm.type}?
                This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === "thread") {
                      handleDeleteThread(showDeleteConfirm.id);
                    }
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Users className="text-white" size={16} />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Community
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Menu size={18} />
              </button>

              <button
                onClick={() => setShowNewThreadForm(true)}
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">New</span>
                <span className="hidden sm:inline">Thread</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="pb-3 sm:pb-4">
            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="sm:hidden mb-4 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Filter size={16} />
                    Filters & Search
                  </span>
                  {showMobileFilters ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            )}

            {/* Desktop Search */}
            <div className="hidden sm:flex gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select> */}
            </div>

            {/* Mobile Search */}
            {showMobileFilters && showMobileMenu && (
              <div className="sm:hidden space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* New Thread Form */}
          {showNewThreadForm && (
            <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-white border border-gray-200 rounded-lg mx-1 sm:mx-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                {editingThread ? "Edit Thread" : "Start a new discussion"}
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label
                    htmlFor="thread-title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title
                  </label>
                  <input
                    id="thread-title"
                    type="text"
                    placeholder="Thread title"
                    value={newThread.title}
                    onChange={(e) =>
                      setNewThread({ ...newThread, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    body
                  </label>
                  <RichTextEditor
                    value={newThread.body}
                    onChange={(body) => setNewThread({ ...newThread, body })}
                    placeholder="What would you like to discuss? You can format text, add code snippets, and upload images..."
                    height="h-64 sm:h-96"
                    darkMode={false}
                  />
                </div>
                <div>
                  <label
                    htmlFor="thread-tags"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tags
                  </label>
                  <input
                    id="thread-tags"
                    type="text"
                    placeholder="Add tags separated by commas (e.g. React, TypeScript, API)"
                    value={newThread.tags}
                    onChange={(e) =>
                      setNewThread({ ...newThread, tags: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCreateThread}
                    disabled={
                      !newThread.title.trim() ||
                      !newThread.body.trim() ||
                      createThreadMutation.isPending ||
                      updateThreadMutation.isPending
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createThreadMutation.isPending ||
                    updateThreadMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>
                          {editingThread ? "Updating..." : "Creating..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>
                          {editingThread ? "Update Thread" : "Create Thread"}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={
                      editingThread
                        ? handleCancelEdit
                        : () => setShowNewThreadForm(false)
                    }
                    disabled={
                      createThreadMutation.isPending ||
                      updateThreadMutation.isPending
                    }
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <MessageCircle size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">{filteredThreads.length}</span>
                <span className="hidden xs:inline">discussions</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">24</span>
                <span className="hidden xs:inline">active</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <Users size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">156</span>
                <span className="hidden xs:inline">members</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>Updated just now</span>
            </div>
          </div>
        </div> */}

        {/* Threads List */}
        <div className="space-y-3 sm:space-y-4">
          {currentThreads.length > 0 ? (
            currentThreads.map((thread) => (
              <div key={thread.id} onClick={() => handleThreadClick(thread.id)}>
                <ThreadCard
                  thread={thread}
                  isExpanded={expandedThreads.has(thread.id)}
                  isBookmarked={isBookmarked[thread.id] || false}
                  refetch={refetch}
                  onToggleExpansion={toggleThreadExpansion}
                  onToggleBookmark={toggleBookmark}
                  onDeleteThread={(threadId) =>
                    setShowDeleteConfirm({ type: "thread", id: threadId })
                  }
                  onEditThread={handleEditThread}
                  onThreadClick={handleThreadClick}
                  onTagSelect={setSelectedTag}
                  canEdit={canEdit}
                />
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || selectedTag
                    ? "No threads found"
                    : "No threads yet"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedTag
                    ? "Try adjusting your search or filter criteria."
                    : "Be the first to start a discussion in the community."}
                </p>
                {!searchTerm && !selectedTag && (
                  <button
                    onClick={() => setShowNewThreadForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Create First Thread
                  </button>
                )}
                {(searchTerm || selectedTag) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTag("");
                    }}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredThreads.length > threadsPerPage && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current page
                    const shouldShow =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!shouldShow) {
                      // Show ellipsis for gaps
                      if (page === 2 && currentPage > 4) {
                        return (
                          <span key={page} className="px-2 py-1 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      if (
                        page === totalPages - 1 &&
                        currentPage < totalPages - 3
                      ) {
                        return (
                          <span key={page} className="px-2 py-1 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Results info */}
        {filteredThreads.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {startIndex + 1}-
            {Math.min(endIndex, filteredThreads.length)} of{" "}
            {filteredThreads.length} threads
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
