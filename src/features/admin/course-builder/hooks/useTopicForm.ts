import { useState } from 'react';
import { TopicFormData, Topic } from '../types/course';

export const useTopicForm = (onSubmit: (topic: Topic) => void) => {
  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    week: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: formData.title,
      week: formData.week,
      description: formData.description,
      subtopics: []
    };
    
    onSubmit(newTopic);
    setFormData({ title: '', week: '', description: '' });
  };

  return {
    formData,
    handleInputChange,
    handleSubmit
  };
}; 