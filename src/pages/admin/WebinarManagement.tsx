import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../services/axiosInstance';

interface WorkshopVariable {
  id?: string;
  WorkshopTitle: string;
  UpcomingWorkshopDate: string;
  WorkshopTime: string;
  SessionNumber: number | string;
  WhatsAppGroupLink: string;
  ZoomJoiningLink: string;
}

interface WorkshopResponse {
  id: string;
  WorkshopTitle: string;
  UpcomingWorkshopDate: string;
  WorkshopTime: string;
  SessionNumber: string | number;
  WhatsAppGroupLink: string;
  ZoomJoiningLink: string;
}

const WebinarManagement: React.FC = () => {
  const [workshops, setWorkshops] = useState<WorkshopVariable[]>([]);
  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopVariable | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WorkshopVariable>({
    WorkshopTitle: '',
    UpcomingWorkshopDate: '',
    WorkshopTime: '',
    SessionNumber: '',
    WhatsAppGroupLink: '',
    ZoomJoiningLink: ''
  });

  const API_URL = 'https://be-app.ailinc.com/api/clients/1/workshop/variables/';

  useEffect(() => {
    fetchWorkshops();
  }, []);

  // Helper function to format session number for API
  const formatSessionForAPI = (sessionNumber: number | string) => {
    const num = typeof sessionNumber === 'string' ? parseInt(sessionNumber) : sessionNumber;
    return `Session-${num.toString().padStart(2, '0')}`;
  };

  // Helper function to extract session number from API format
  const extractSessionNumber = (sessionString: string | number) => {
    if (typeof sessionString === 'number') return sessionString;
    if (typeof sessionString === 'string' && sessionString.startsWith('Session-')) {
      return parseInt(sessionString.replace('Session-', ''));
    }
    return parseInt(sessionString.toString()) || 1;
  };

  // Helper function to convert date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Helper function to convert date from DD-MM-YYYY to YYYY-MM-DD for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  // Helper function to format time as HH:MM:SS
  const formatTimeForAPI = (timeString: string) => {
    if (!timeString) return '';
    // If time is HH:MM, add :00 for seconds
    return timeString.includes(':') && timeString.split(':').length === 2
      ? `${timeString}:00`
      : timeString;
  };

  // Helper function to format time for input (HH:MM)
  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '';
    // If time is HH:MM:SS, remove seconds
    return timeString.split(':').slice(0, 2).join(':');
  };

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_URL);
      console.log('API Response:', response.data);

      let workshopData = response.data;
      if (!Array.isArray(workshopData)) {
        workshopData = [workshopData];
      }

      const workshopsWithIds = workshopData.map((workshop: WorkshopResponse, index: number) => ({
        ...workshop,
        id: workshop.id || `workshop_${index}`,
      }));

      setWorkshops(workshopsWithIds);
    } catch (error: unknown) {
      console.error('Error fetching workshops:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
      }
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkshop = async () => {
    try {
      setLoading(true);

      const requestData = {
        WorkshopTitle: formData.WorkshopTitle,
        UpcomingWorkshopDate: formatDateForAPI(formData.UpcomingWorkshopDate),
        WorkshopTime: formatTimeForAPI(formData.WorkshopTime),
        SessionNumber: formatSessionForAPI(formData.SessionNumber),
        WhatsAppGroupLink: formData.WhatsAppGroupLink || "",
        ZoomJoiningLink: formData.ZoomJoiningLink || ""
      };

      console.log('Create Request Data:', requestData);

      const response = await axiosInstance.post(API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Create Response:', response.data);

      await fetchWorkshops();
      resetForm();
      alert('Workshop created successfully!');
    } catch (error: unknown) {
      console.error('Error creating workshop:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
        alert(`Error creating workshop: ${error.response?.data?.message || error.message}`);
      } else {
        alert('An unexpected error occurred while creating the workshop.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkshop = async () => {
    if (!editingWorkshop) {
      alert('No workshop selected for editing');
      return;
    }

    try {
      setLoading(true);

      // Prepare the request data exactly as the API expects
      const requestData = {
        WorkshopTitle: formData.WorkshopTitle,
        UpcomingWorkshopDate: formatDateForAPI(formData.UpcomingWorkshopDate),
        WorkshopTime: formatTimeForAPI(formData.WorkshopTime),
        SessionNumber: formData.SessionNumber.toString().startsWith('Session-')
          ? formData.SessionNumber
          : formatSessionForAPI(formData.SessionNumber),
        WhatsAppGroupLink: formData.WhatsAppGroupLink || "",
        ZoomJoiningLink: formData.ZoomJoiningLink || ""
      };

      console.log('PATCH Request Data:', requestData);

      // Check if this is a real database ID or a temporary frontend ID
      const workshopId = editingWorkshop.id;
      let apiUrl = API_URL;

      if (workshopId && !workshopId.toString().startsWith('workshop_')) {
        // Real database ID - append to URL
        apiUrl = `${API_URL}${workshopId}/`;
        console.log('Request URL (with ID):', apiUrl);
      } else {
        // Temporary frontend ID or no ID - use base URL for single resource update
        console.log('Request URL (base):', apiUrl);
        console.log('Note: Using base URL as workshop has temporary/no ID');
      }

      // Make the PATCH request to update the workshop
      const response = await axiosInstance.patch(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('PATCH Response:', response.data);

      // Check if response has 'updated' array as shown in your API response
      if (response.data && response.data.updated) {
        console.log('Updated fields:', response.data.updated);
      }

      // Refresh the workshops list to show updated data
      await fetchWorkshops();
      resetForm();
      alert('Workshop updated successfully!');

    } catch (error: unknown) {
      console.error('Error updating workshop:', error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;

        console.log('Error Status:', statusCode);
        console.log('Error Data:', errorData);

        let errorMessage = '';
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = error.message;
        }

        switch (statusCode) {
          case 400:
            alert(`Invalid data format: ${errorMessage}`);
            break;
          case 401:
            alert('Authentication required. Please log in again.');
            break;
          case 403:
            alert('Access denied. You need admin or superadmin role to perform this action.');
            break;
          case 404:
            alert('Workshop not found. Trying to update using base URL instead.');
            // If 404 with ID, try again with base URL
            if (editingWorkshop.id && !editingWorkshop.id.toString().startsWith('workshop_')) {
              console.log('Retrying update with base URL...');
              // Recursive call would cause issues, so just inform user
              alert('Please try the update operation again.');
            }
            break;
          case 405:
            alert('Update operation not allowed. Please check API permissions.');
            break;
          case 500:
            alert('Server error. Please try again later.');
            break;
          default:
            alert(`Error updating workshop (${statusCode}): ${errorMessage}`);
        }
      } else {
        alert('An unexpected error occurred while updating the workshop.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (workshop: WorkshopVariable) => {
    setEditingWorkshop(workshop);

    console.log('Editing workshop:', workshop);

    setFormData({
      WorkshopTitle: workshop.WorkshopTitle || '',
      UpcomingWorkshopDate: formatDateForInput(workshop.UpcomingWorkshopDate || ''),
      WorkshopTime: formatTimeForInput(workshop.WorkshopTime || ''),
      SessionNumber: extractSessionNumber(workshop.SessionNumber || ''),
      WhatsAppGroupLink: workshop.WhatsAppGroupLink || '',
      ZoomJoiningLink: workshop.ZoomJoiningLink || ''
    });

    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      WorkshopTitle: '',
      UpcomingWorkshopDate: '',
      WorkshopTime: '',
      SessionNumber: '',
      WhatsAppGroupLink: '',
      ZoomJoiningLink: ''
    });
    setEditingWorkshop(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.WorkshopTitle.trim()) {
      alert('Workshop Title is required');
      return;
    }
    if (!formData.UpcomingWorkshopDate) {
      alert('Workshop Date is required');
      return;
    }
    if (!formData.WorkshopTime) {
      alert('Workshop Time is required');
      return;
    }
    if (!formData.SessionNumber) {
      alert('Session Number is required');
      return;
    }

    if (editingWorkshop) {
      handleUpdateWorkshop();
    } else {
      handleCreateWorkshop();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Workshop Management</h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">Manage your workshop schedules and information</p>
        </div>

        <div className="mb-6">
          {/* <button
            onClick={() => setShowForm(true)}
            disabled={true}
            className="bg-gray-400 cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
          >
            + Create New Workshop
          </button> */}
        </div>

        {showForm && (
          <div className="mb-6 lg:mb-8 bg-white rounded-lg shadow-md p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold mb-4">
              {editingWorkshop ? 'Edit Workshop' : 'Create New Workshop'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workshop Title *
                  </label>
                  <input
                    type="text"
                    value={formData.WorkshopTitle}
                    onChange={(e) => setFormData({ ...formData, WorkshopTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workshop Date *
                  </label>
                  <input
                    type="date"
                    value={formData.UpcomingWorkshopDate}
                    onChange={(e) => setFormData({ ...formData, UpcomingWorkshopDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workshop Time *
                  </label>
                  <input
                    type="time"
                    value={formData.WorkshopTime}
                    onChange={(e) => setFormData({ ...formData, WorkshopTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.SessionNumber || ''}
                    onChange={(e) => setFormData({ ...formData, SessionNumber: parseInt(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Group Link
                  </label>
                  <input
                    type="url"
                    value={formData.WhatsAppGroupLink}
                    onChange={(e) => setFormData({ ...formData, WhatsAppGroupLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    placeholder="https://chat.whatsapp.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoom Joining Link
                  </label>
                  <input
                    type="url"
                    value={formData.ZoomJoiningLink}
                    onChange={(e) => setFormData({ ...formData, ZoomJoiningLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                >
                  {loading ? 'Processing...' : (editingWorkshop ? 'Update Workshop' : 'Create Workshop')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 text-sm lg:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Workshop List</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading workshops...</p>
            </div>
          ) : workshops.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No workshops found. Create your first workshop to get started.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workshops.map((workshop, index) => (
                      <tr key={workshop.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{workshop.WorkshopTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{workshop.UpcomingWorkshopDate}</div>
                          <div className="text-sm text-gray-500">{workshop.WorkshopTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {typeof workshop.SessionNumber === 'string' ? workshop.SessionNumber : `Session ${workshop.SessionNumber}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            {workshop.WhatsAppGroupLink && (
                              <a href={workshop.WhatsAppGroupLink} target="_blank" rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 block">WhatsApp</a>
                            )}
                            {workshop.ZoomJoiningLink && (
                              <a href={workshop.ZoomJoiningLink} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 block">Zoom</a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(workshop)}
                            disabled={loading}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {workshops.map((workshop, index) => (
                  <div key={workshop.id || index} className="border-b border-gray-200 p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Workshop Title</h3>
                        <p className="text-sm text-gray-700">{workshop.WorkshopTitle}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date</h4>
                          <p className="text-sm text-gray-900">{workshop.UpcomingWorkshopDate}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Time</h4>
                          <p className="text-sm text-gray-900">{workshop.WorkshopTime}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Session</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {typeof workshop.SessionNumber === 'string' ? workshop.SessionNumber : `Session ${workshop.SessionNumber}`}
                        </span>
                      </div>

                      {(workshop.WhatsAppGroupLink || workshop.ZoomJoiningLink) && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Links</h4>
                          <div className="flex flex-wrap gap-2">
                            {workshop.WhatsAppGroupLink && (
                              <a
                                href={workshop.WhatsAppGroupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                WhatsApp
                              </a>
                            )}
                            {workshop.ZoomJoiningLink && (
                              <a
                                href={workshop.ZoomJoiningLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                Zoom
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          onClick={() => handleEdit(workshop)}
                          disabled={loading}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                        >
                          Edit Workshop
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebinarManagement;