// LiveAdmin.tsx
import { useQuery } from "@tanstack/react-query";
import {
  liveServicesApis,
  LiveSession,
} from "../../../services/live/liveServicesApis";
import CreateLiveAdmin from "./CreateLiveAdmin";
import { useState } from "react";
import PastRecordings from "../../live/components/PastRecordings";
import Modal from "../../../commonComponents/modals/GenricModal";

const LiveAdmin = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["liveSessions"],
    queryFn: () => liveServicesApis(clientId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#255C79] mb-4">
        Live Admin Dashboard
      </h1>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-[#255C79] hover:bg-[#1E4A63] text-white py-2 px-6 rounded-lg mb-6"
      >
        ➕ Create New Live Session
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateLiveAdmin
          onClose={() => setIsModalOpen(false)}
          refetch={refetch}
        />
      </Modal>

      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error loading sessions</p>
      ) : (
        <PastRecordings
          pastLiveSessions={(data || []).sort(
            (a: LiveSession, b: LiveSession) =>
              new Date(b.class_datetime).getTime() -
              new Date(a.class_datetime).getTime()
          )}
          refetch={refetch}
        />
      )}
    </div>
  );
};

export default LiveAdmin;
