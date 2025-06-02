import { useState } from 'react';
import { SubtopicFormData, Subtopic } from '../types/course';

export const useSubtopicForm = (onSubmit: (subtopic: Subtopic) => void) => {
  const [formData, setFormData] = useState<SubtopicFormData>({
    title: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSubtopic: Subtopic = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      contents: []
    };
    
    onSubmit(newSubtopic);
    setFormData({ title: '', description: '' });
  };

  return {
    formData,
    handleInputChange,
    handleSubmit
  };
}; 