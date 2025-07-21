import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getEmailJobsStatus,
  restartFailedJob,
  getEmailJobs,
} from "../../../services/admin/workshopRegistrationApis";
import { useMutation, useQuery } from "@tanstack/react-query";
import EmailJobStatusModal from "./EmailJobStatusModal";
import EmailJobsHistoryModal, { EmailJob } from "./EmailJobsHistoryModal";
import EmailForm from "./EmailForm";
import AccessDenied from "../../../components/AccessDenied";
import { useRole } from "../../../hooks/useRole";

interface EmailSelfServeProps {
  preFilledEmails?: string[];
  preFilledRecipients?: Array<{ email: string; name: string }>;
}

const EmailSelfServe: React.FC<EmailSelfServeProps> = ({
  preFilledEmails = [],
  preFilledRecipients = [],
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<Record<string, unknown> | null>(
    null
  );

  // Get pre-filled emails from location state or props
  const emailsFromState =
    (location.state as { preFilledEmails?: string[] })?.preFilledEmails || [];
  const recipientsFromState =
    (
      location.state as {
        preFilledRecipients?: Array<{ email: string; name: string }>;
      }
    )?.preFilledRecipients || [];

  const finalPreFilledEmails =
    preFilledEmails.length > 0 ? preFilledEmails : emailsFromState;
  const finalPreFilledRecipients =
    preFilledRecipients.length > 0 ? preFilledRecipients : recipientsFromState;

  // Update showHistoryModal based on whether we have pre-filled emails or recipients
  useEffect(() => {
    if (
      finalPreFilledEmails.length > 0 ||
      finalPreFilledRecipients.length > 0
    ) {
      setShowHistoryModal(false);
    }
  }, [finalPreFilledEmails.length, finalPreFilledRecipients.length]);

  const {
    data: emailJobs,
    isLoading: isEmailJobsLoading,
    error: emailJobsError,
  } = useQuery({
    queryKey: ["emailJobs"],
    queryFn: () => getEmailJobs(clientId),
  });

  const updateJobMutation = useMutation({
    mutationFn: (jobId: string) => getEmailJobsStatus(clientId, jobId),
  });
  // Add a constant for localStorage key
  const LOCAL_STORAGE_KEY = "emailJobStatus";

  const restartJobMutation = useMutation({
    mutationFn: (jobId: string) => restartFailedJob(clientId, jobId),
    onSuccess: () => {
      handleRefreshStatus();
    },
    onError: () => {
      // Error handling is done in the mutation
    },
  });

  const handleRestartFailedEmails = () => {
    if (jobId) {
      restartJobMutation.mutate(jobId);
    }
  };

  const fetchJobStatus = async (id: string) => {
    if (!id) return;
    try {
      const status = await getEmailJobsStatus(clientId, id);
      setJobStatus(status);
    } catch {
      setJobStatus(null);
    }
  };

  // On mount, check localStorage for jobId and check for in-progress jobs
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.jobId) {
          setJobId(parsed.jobId);
          setShowStatusModal(true);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Check if there are any in-progress jobs
    if (emailJobs && emailJobs.length > 0) {
      const inProgressJob = emailJobs.find(
        (job: EmailJob) => job.status === "IN_PROGRESS"
      );
      if (inProgressJob) {
        setJobId(inProgressJob.task_id);
        setShowStatusModal(true);
      }
    }
  }, [emailJobs]);

  useEffect(() => {
    if (showStatusModal && jobId) {
      fetchJobStatus(jobId);
    }
  }, [showStatusModal, jobId]);

  const handleRefreshStatus = () => {
    if (jobId) {
      setIsRefreshing(true);
      updateJobMutation.mutate(jobId, {
        onSuccess: (data) => {
          setJobStatus(data);
          setIsRefreshing(false);
        },
        onError: () => {
          setIsRefreshing(false);
        },
      });
    }
  };

  // When modal is closed, clear localStorage
  const handleCloseModal = () => {
    setShowStatusModal(false);
    setJobId(null);
    setJobStatus(null);
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleViewJobStatus = (jobId: string) => {
    setJobId(jobId);
    setShowStatusModal(true);
  };

  const handleCreateNewJob = () => {
    setShowHistoryModal(false);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  const handleJobCreated = (jobId: string) => {
    setJobId(jobId);
    setShowStatusModal(true);
    // Save to localStorage
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ jobId: jobId })
    );
  };

  const { isSuperAdmin } = useRole();

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  return (
    <>
      {/* Email Form - Always visible */}
      <EmailForm
        clientId={clientId}
        onJobCreated={handleJobCreated}
        onViewHistory={handleViewHistory}
        preFilledRecipients={finalPreFilledRecipients}
      />

      {/* Email Jobs History Modal */}
      <EmailJobsHistoryModal
        open={showHistoryModal}
        onClose={handleCloseHistoryModal}
        emailJobs={emailJobs}
        isLoading={isEmailJobsLoading}
        error={emailJobsError}
        onViewStatus={handleViewJobStatus}
        onCreateNewJob={handleCreateNewJob}
      />

      {/* Email Job Status Modal */}
      <EmailJobStatusModal
        open={showStatusModal}
        onClose={handleCloseModal}
        jobStatus={jobStatus}
        onRefresh={handleRefreshStatus}
        onResend={handleRestartFailedEmails}
        isResending={restartJobMutation.isPending}
        isRefreshing={isRefreshing}
      />
    </>
  );
};

export default EmailSelfServe;
