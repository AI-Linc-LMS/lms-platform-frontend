import React, { useState, useEffect } from 'react';
import { WebinarData, WebinarFormData } from '../../types/webinar';
import WebinarForm from '../../components/admin/WebinarForm';
import WebinarList from '../../components/admin/WebinarList';

const WebinarManagement: React.FC = () => {
  const [webinars, setWebinars] = useState<WebinarData[]>([]);
  const [editingWebinar, setEditingWebinar] = useState<WebinarData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock data for UI demonstration
    const mockWebinars: WebinarData[] = [
      {
        id: '1',
        title: 'Introduction to React',
        subtitle: 'Learn the basics of React development',
        date: '2024-01-15',
        time: '14:00',
        day: 'Monday',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Advanced JavaScript',
        subtitle: 'Deep dive into modern JavaScript features',
        date: '2024-01-20',
        time: '16:00',
        day: 'Saturday',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ];
    
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      setWebinars(mockWebinars);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateWebinar = (formData: WebinarFormData) => {
    const newWebinar: WebinarData = {
      id: Date.now().toString(),
      ...formData,
      day: new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' }),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setWebinars(prev => [...prev, newWebinar]);
    setShowForm(false);
  };

  const handleUpdateWebinar = (formData: WebinarFormData) => {
    if (!editingWebinar?.id) return;

    const updatedWebinar: WebinarData = {
      ...editingWebinar,
      ...formData,
      day: new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' }),
      updatedAt: new Date().toISOString(),
    };

    setWebinars(prev => 
      prev.map(webinar => 
        webinar.id === editingWebinar.id ? updatedWebinar : webinar
      )
    );
    setEditingWebinar(null);
    setShowForm(false);
  };

  const handleDeleteWebinar = (id: string) => {
    if (!confirm('Are you sure you want to delete this webinar?')) return;

    setWebinars(prev => prev.filter(webinar => webinar.id !== id));
  };

  const handleEdit = (webinar: WebinarData) => {
    setEditingWebinar(webinar);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingWebinar(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Webinar Management</h1>
          <p className="text-gray-600 mt-2">Manage your webinar schedules and information</p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Create New Webinar
          </button>
        </div>

        {showForm && (
          <div className="mb-8">
            <WebinarForm
              initialData={editingWebinar}
              onSubmit={editingWebinar ? handleUpdateWebinar : handleCreateWebinar}
              onCancel={handleCancel}
              isEditing={!!editingWebinar}
            />
          </div>
        )}

        <WebinarList
          webinars={webinars}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteWebinar}
        />
      </div>
    </div>
  );
};

export default WebinarManagement;
