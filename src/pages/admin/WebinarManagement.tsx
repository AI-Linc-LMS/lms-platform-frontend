import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../services/axiosInstance';
import PermissionDeniedModal from '../../features/admin/workshop-registrations/components/modals/PermissionDeniedModal';

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
  const [permissionDeniedOpen, setPermissionDeniedOpen] = useState(false);
  const handleCreateWorkshop = async () => {
    try {
      setPermissionDeniedOpen(false);
      return;

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

    setPermissionDeniedOpen(true);
    return;
    // try {
    //   setLoading(true);

    //   // Prepare the request data exactly as the API expects
    //   const requestData = {
    //     WorkshopTitle: formData.WorkshopTitle,
    //     UpcomingWorkshopDate: formatDateForAPI(formData.UpcomingWorkshopDate),
    //     WorkshopTime: formatTimeForAPI(formData.WorkshopTime),
    //     SessionNumber: formData.SessionNumber.toString().startsWith('Session-')
    //       ? formData.SessionNumber
    //       : formatSessionForAPI(formData.SessionNumber),
    //     WhatsAppGroupLink: formData.WhatsAppGroupLink || "",
    //     ZoomJoiningLink: formData.ZoomJoiningLink || ""
    //   };

    //   console.log('PATCH Request Data:', requestData);

    //   // Check if this is a real database ID or a temporary frontend ID
    //   const workshopId = editingWorkshop?.id;
    //   let apiUrl = API_URL;

    //   if (workshopId && !workshopId?.toString().startsWith('workshop_')) {
    //     // Real database ID - append to URL
    //     apiUrl = `${API_URL}${workshopId}/`;
    //     console.log('Request URL (with ID):', apiUrl);
    //   } else {
    //     // Temporary frontend ID or no ID - use base URL for single resource update
    //     console.log('Request URL (base):', apiUrl);
    //     console.log('Note: Using base URL as workshop has temporary/no ID');
    //   }

    //   // Make the PATCH request to update the workshop
    //   const response = await axiosInstance.patch(apiUrl, requestData, {
    //     headers: {
    //       'Content-Type': 'application/json',
    //     }
    //   });

    //   console.log('PATCH Response:', response.data);

    //   // Check if response has 'updated' array as shown in your API response
    //   if (response.data && response.data.updated) {
    //     console.log('Updated fields:', response.data.updated);
    //   }

    //   // Refresh the workshops list to show updated data
    //   await fetchWorkshops();
    //   resetForm();
    //   alert('Workshop updated successfully!');

    // } catch (error: unknown) {
    //   console.error('Error updating workshop:', error);

    //   if (axios.isAxiosError(error)) {

    //     let errorMessage = '';
    //     if (error?.response?.data?.message) {
    //       errorMessage = error.response.data.message;
    //     } else if (error?.response?.data?.detail) {
    //       errorMessage = errorData.detail;
    //     } else if (typeof errorData === 'string') {
    //       errorMessage = errorData;
    //     } else {
    //       errorMessage = error?.message;
    //     }

    //     switch (statusCode) {
    //       case 400:
    //         alert(`Invalid data format: ${errorMessage}`);
    //         break;
    //       case 401:
    //         alert('Authentication required. Please log in again.');
    //         break;
    //       case 403:
    //         alert('Access denied. You need admin or superadmin role to perform this action.');
    //         break;
    //       case 404:
    //         alert('Workshop not found. Trying to update using base URL instead.');
    //         // If 404 with ID, try again with base URL
    //         if (editingWorkshop?.id && !editingWorkshop?.id?.toString().startsWith('workshop_')) {
    //           console.log('Retrying update with base URL...');
    //           // Recursive call would cause issues, so just inform user
    //           alert('Please try the update operation again.');
    //         }
    //         break;
    //       case 405:
    //         alert('Update operation not allowed. Please check API permissions.');
    //         break;
    //       case 500:
    //         alert('Server error. Please try again later.');
    //         break;
    //       default:
    //         alert(`Error updating workshop (${statusCode}): ${errorMessage}`);
    //     }
    //   } else {
    //     alert('An unexpected error occurred while updating the workshop.');
    //   }
    // } finally {
    //   setLoading(false);
    // }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Workshop Settings
            </h1>
          </div>
          <p className="text-gray-600 text-sm lg:text-base ml-11">
            Manage your workshop schedules and information with ease
          </p>
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
          <div className="mb-8 lg:mb-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                {editingWorkshop ? 'Edit Workshop' : 'Create New Workshop'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workshop Title *
                  </label>
                  <input
                    type="text"
                    value={formData.WorkshopTitle}
                    onChange={(e) => setFormData({ ...formData, WorkshopTitle: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-sm lg:text-base font-medium"
                    placeholder="Enter workshop title..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workshop Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.UpcomingWorkshopDate}
                      onChange={(e) => setFormData({ ...formData, UpcomingWorkshopDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-sm lg:text-base font-medium"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workshop Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.WorkshopTime}
                      onChange={(e) => setFormData({ ...formData, WorkshopTime: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-sm lg:text-base font-medium"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.SessionNumber || ''}
                    onChange={(e) => setFormData({ ...formData, SessionNumber: parseInt(e.target.value) || '' })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-sm lg:text-base font-medium"
                    placeholder="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp Group Link
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.WhatsAppGroupLink}
                      onChange={(e) => setFormData({ ...formData, WhatsAppGroupLink: e.target.value })}
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-sm lg:text-base"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.594z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Zoom Joining Link
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.ZoomJoiningLink}
                      onChange={(e) => setFormData({ ...formData, ZoomJoiningLink: e.target.value })}
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-sm lg:text-base"
                      placeholder="https://zoom.us/j/..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.5 2a2.5 2.5 0 00-2.5 2.5v15a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5v-15a2.5 2.5 0 00-2.5-2.5h-11zM12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 8h8v1.5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5V14z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </span>
                  ) : (
                    editingWorkshop ? 'Update Workshop' : 'Create Workshop'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 text-sm lg:text-base border-2 border-gray-200 hover:border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="px-6 lg:px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Workshop List</h2>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                {workshops.length} workshop{workshops.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading workshops...</p>
            </div>
          ) : workshops.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No workshops found</p>
              <p className="text-gray-400 text-sm mt-1">Create your first workshop to get started</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Title</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date & Time</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Session</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Links</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {workshops.map((workshop, index) => (
                      <tr key={workshop.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{workshop.WorkshopTitle}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{workshop.UpcomingWorkshopDate}</div>
                          <div className="text-sm text-gray-500">{workshop.WorkshopTime}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                            {typeof workshop.SessionNumber === 'string' ? workshop.SessionNumber : `Session ${workshop.SessionNumber}`}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {workshop.WhatsAppGroupLink && (
                              <a href={workshop.WhatsAppGroupLink} target="_blank" rel="noopener noreferrer" 
                                 className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors border border-green-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.594z"/>
                                </svg>
                                WhatsApp
                              </a>
                            )}
                            {workshop.ZoomJoiningLink && (
                              <a href={workshop.ZoomJoiningLink} target="_blank" rel="noopener noreferrer"
                                 className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors border border-blue-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6.5 2a2.5 2.5 0 00-2.5 2.5v15a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5v-15a2.5 2.5 0 00-2.5-2.5h-11zM12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 8h8v1.5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5V14z"/>
                                </svg>
                                Zoom
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(workshop)}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
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
                  <div key={workshop.id || index} className="border-b border-gray-100 p-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Workshop Title</h3>
                        <p className="text-base font-semibold text-gray-900">{workshop.WorkshopTitle}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</h4>
                          <p className="text-sm font-semibold text-gray-900">{workshop.UpcomingWorkshopDate}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time</h4>
                          <p className="text-sm font-semibold text-gray-900">{workshop.WorkshopTime}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Session</h4>
                        <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                          {typeof workshop.SessionNumber === 'string' ? workshop.SessionNumber : `Session ${workshop.SessionNumber}`}
                        </span>
                      </div>

                      {(workshop.WhatsAppGroupLink || workshop.ZoomJoiningLink) && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Links</h4>
                          <div className="flex flex-wrap gap-3">
                            {workshop.WhatsAppGroupLink && (
                              <a
                                href={workshop.WhatsAppGroupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors border border-green-200"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.594z"/>
                                </svg>
                                WhatsApp
                              </a>
                            )}
                            {workshop.ZoomJoiningLink && (
                              <a
                                href={workshop.ZoomJoiningLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors border border-blue-200"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6.5 2a2.5 2.5 0 00-2.5 2.5v15a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5v-15a2.5 2.5 0 00-2.5-2.5h-11zM12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 8h8v1.5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5V14z"/>
                                </svg>
                                Zoom
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(workshop)}
                          disabled={loading}
                          className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
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

      <PermissionDeniedModal
        isOpen={permissionDeniedOpen}
        onClose={() => setPermissionDeniedOpen(false)}
      />
    </div>
  );
};

export default WebinarManagement;