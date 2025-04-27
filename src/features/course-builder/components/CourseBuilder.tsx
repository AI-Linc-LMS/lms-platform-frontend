/** @jsxImportSource @emotion/react */
import { jsx } from '@emotion/react';
import React, { useState } from 'react';
import { Course, Module, Lesson, LessonContent, Instructor, VideoContent, ArticleContent, LessonContentType, QuizContent as QuizContentType, QuizQuestion, QuizOption } from '../types/course.types';
import RichTextEditor from './RichTextEditor';
import QuizContent from './QuizContent';

interface CourseBuilderProps {}

const CourseBuilder = (): React.ReactElement => {
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    difficulty: 'beginner',
    instructors: [],
    modules: []
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<{
    moduleIndex: number;
    lessonIndex: number;
    contentIndex: number;
    field: 'content' | 'description';
  } | null>(null);

  const handleCourseChange = (field: keyof Course, value: any) => {
    setCourse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInstructor = () => {
    const newInstructor: Instructor = {
      id: Date.now().toString(),
      name: '',
      designation: ''
    };
    setCourse(prev => ({
      ...prev,
      instructors: [...(prev.instructors || []), newInstructor]
    }));
  };

  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: '',
      week: (course.modules?.length || 0) + 1,
      lessons: []
    };
    setCourse(prev => ({
      ...prev,
      modules: [...(prev.modules || []), newModule]
    }));
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: '',
      contents: []
    };
    setCourse(prev => {
      const newModules = [...(prev.modules || [])];
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lessons: [...(newModules[moduleIndex].lessons || []), newLesson]
      };
      return { ...prev, modules: newModules };
    });
  };

  const addLessonContent = (moduleIndex: number, lessonIndex: number, type: LessonContentType) => {
    let newContent: LessonContent;
    
    if (type === 'video') {
      newContent = {
        id: Date.now().toString(),
        type: 'video',
        title: '',
        description: '',
        marks: 0,
        duration: 0,
        url: '',
      };
    } else if (type === 'article') {
      newContent = {
        id: Date.now().toString(),
        type: 'article',
        title: '',
        content: '',
        marks: 0,
        url: '',
      };
    } else if (type === 'quiz') {
      newContent = {
        id: Date.now().toString(),
        type: 'quiz',
        title: '',
        description: '',
        questions: [],
      };
    } else {
      newContent = {
        id: Date.now().toString(),
        type,
        title: '',
        description: '',
        questions: [],
      };
    }

    setCourse(prev => {
      const newModules = [...(prev.modules || [])];
      const newLessons = [...(newModules[moduleIndex].lessons || [])];
      newLessons[lessonIndex] = {
        ...newLessons[lessonIndex],
        contents: [...(newLessons[lessonIndex].contents || []), newContent]
      };
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lessons: newLessons
      };
      return { ...prev, modules: newModules };
    });
  };

  const addQuizQuestion = (moduleIndex: number, lessonIndex: number, contentIndex: number) => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      questionText: '',
      marks: 0,
      options: [],
      explanation: ''
    };

    setCourse(prev => {
      const newModules = [...(prev.modules || [])];
      const newLessons = [...(newModules[moduleIndex].lessons || [])];
      const newContents = [...(newLessons[lessonIndex].contents || [])];
      const quizContent = newContents[contentIndex] as QuizContentType;
      quizContent.questions = [...(quizContent.questions || []), newQuestion];
      newLessons[lessonIndex] = {
        ...newLessons[lessonIndex],
        contents: newContents
      };
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lessons: newLessons
      };
      return { ...prev, modules: newModules };
    });
  };

  const addQuizOption = (moduleIndex: number, lessonIndex: number, contentIndex: number, questionIndex: number) => {
    const newOption: QuizOption = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false
    };

    setCourse(prev => {
      const newModules = [...(prev.modules || [])];
      const newLessons = [...(newModules[moduleIndex].lessons || [])];
      const newContents = [...(newLessons[lessonIndex].contents || [])];
      const quizContent = newContents[contentIndex] as QuizContentType;
      quizContent.questions[questionIndex].options = [...(quizContent.questions[questionIndex].options || []), newOption];
      newLessons[lessonIndex] = {
        ...newLessons[lessonIndex],
        contents: newContents
      };
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lessons: newLessons
      };
      return { ...prev, modules: newModules };
    });
  };

  const openEditor = (moduleIndex: number, lessonIndex: number, contentIndex: number, field: 'description' | 'content') => {
    setCurrentContent({ moduleIndex, lessonIndex, contentIndex, field });
    setIsEditorOpen(true);
  };

  const handleEditorChange = (value: string) => {
    if (!currentContent) return;

    setCourse(prevCourse => {
      const newCourse = { ...prevCourse };
      if (!newCourse.modules) return newCourse;

      const module = newCourse.modules[currentContent.moduleIndex];
      if (!module?.lessons) return newCourse;

      const lesson = module.lessons[currentContent.lessonIndex];
      if (!lesson?.contents) return newCourse;

      const content = lesson.contents[currentContent.contentIndex];
      if (!content) return newCourse;

      if (currentContent.field === 'content' && 'content' in content) {
        (content as ArticleContent).content = value;
      } else if ('description' in content) {
        if (content.type === 'video') {
          (content as VideoContent).description = value;
        } else if (content.type === 'quiz') {
          (content as QuizContentType).description = value;
        }
      }

      return newCourse;
    });
  };

  const handleQuizContentChange = (moduleIndex: number, lessonIndex: number, contentIndex: number, newContent: QuizContentType) => {
    setCourse(prev => {
      const newModules = [...(prev.modules || [])];
      const newLessons = [...(newModules[moduleIndex].lessons || [])];
      const newContents = [...(newLessons[lessonIndex].contents || [])];
      newContents[contentIndex] = newContent;
      newLessons[lessonIndex] = {
        ...newLessons[lessonIndex],
        contents: newContents
      };
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lessons: newLessons
      };
      return { ...prev, modules: newModules };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Course Builder</h1>
        
        {/* Basic Course Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={course.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCourseChange('title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter course title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={course.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleCourseChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter course description"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={course.difficulty}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCourseChange('difficulty', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Instructors Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Instructors</h2>
            <button
              onClick={addInstructor}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Instructor
            </button>
          </div>
          <div className="space-y-4">
            {course.instructors?.map((instructor, index) => (
              <div key={instructor.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={instructor.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newInstructors = [...(course.instructors || [])];
                    newInstructors[index] = { ...instructor, name: e.target.value };
                    handleCourseChange('instructors', newInstructors);
                  }}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Instructor name"
                />
                <input
                  type="text"
                  value={instructor.designation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newInstructors = [...(course.instructors || [])];
                    newInstructors[index] = { ...instructor, designation: e.target.value };
                    handleCourseChange('instructors', newInstructors);
                  }}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Designation"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modules Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
            <button
              onClick={addModule}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Module
            </button>
          </div>
          <div className="space-y-6">
            {course.modules?.map((module, moduleIndex) => (
              <div key={module.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex gap-4 mb-6">
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newModules = [...(course.modules || [])];
                      newModules[moduleIndex] = { ...module, title: e.target.value };
                      handleCourseChange('modules', newModules);
                    }}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Module title"
                  />
                  <input
                    type="number"
                    value={module.week}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newModules = [...(course.modules || [])];
                      newModules[moduleIndex] = { ...module, week: parseInt(e.target.value) };
                      handleCourseChange('modules', newModules);
                    }}
                    className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Week"
                  />
                </div>

                {/* Lessons Section */}
                <div className="ml-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
                    <button
                      onClick={() => addLesson(moduleIndex)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Lesson
                    </button>
                  </div>
                  <div className="space-y-6">
                    {module.lessons?.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="border border-gray-200 rounded-xl p-6 bg-white">
                        <div className="mb-6">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newModules = [...(course.modules || [])];
                              const newLessons = [...(newModules[moduleIndex].lessons || [])];
                              newLessons[lessonIndex] = { ...lesson, title: e.target.value };
                              newModules[moduleIndex] = {
                                ...newModules[moduleIndex],
                                lessons: newLessons
                              };
                              handleCourseChange('modules', newModules);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Lesson title"
                          />
                        </div>

                        {/* Lesson Content Section */}
                        <div className="ml-4">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-md font-semibold text-gray-900">Content</h4>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addLessonContent(moduleIndex, lessonIndex, 'video')}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add Video
                              </button>
                              <button
                                onClick={() => addLessonContent(moduleIndex, lessonIndex, 'article')}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add Article
                              </button>
                              <button
                                onClick={() => addLessonContent(moduleIndex, lessonIndex, 'problem')}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add Problem
                              </button>
                              <button
                                onClick={() => addLessonContent(moduleIndex, lessonIndex, 'assignment')}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add Assignment
                              </button>
                              <button
                                onClick={() => addLessonContent(moduleIndex, lessonIndex, 'quiz')}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Add Quiz
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {lesson.contents?.map((content, contentIndex) => (
                              <div key={content.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                                <div className="flex gap-4 mb-4">
                                  <input
                                    type="text"
                                    value={content.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const newModules = [...(course.modules || [])];
                                      const newLessons = [...(newModules[moduleIndex].lessons || [])];
                                      const newContents = [...(newLessons[lessonIndex].contents || [])];
                                      newContents[contentIndex] = { ...content, title: e.target.value };
                                      newLessons[lessonIndex] = {
                                        ...newLessons[lessonIndex],
                                        contents: newContents
                                      };
                                      newModules[moduleIndex] = {
                                        ...newModules[moduleIndex],
                                        lessons: newLessons
                                      };
                                      handleCourseChange('modules', newModules);
                                    }}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder={`Enter ${content.type} title`}
                                  />
                                </div>
                                {content.type === 'quiz' && (
                                  <QuizContent
                                    content={content as QuizContentType}
                                    onContentChange={(newContent: QuizContentType) => handleQuizContentChange(moduleIndex, lessonIndex, contentIndex, newContent)}
                                  />
                                )}
                                {content.type === 'video' && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                                      <input
                                        type="text"
                                        value={(content as VideoContent).url}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const newModules = [...(course.modules || [])];
                                          const newLessons = [...(newModules[moduleIndex].lessons || [])];
                                          const newContents = [...(newLessons[lessonIndex].contents || [])];
                                          (newContents[contentIndex] as VideoContent).url = e.target.value;
                                          newLessons[lessonIndex] = {
                                            ...newLessons[lessonIndex],
                                            contents: newContents
                                          };
                                          newModules[moduleIndex] = {
                                            ...newModules[moduleIndex],
                                            lessons: newLessons
                                          };
                                          handleCourseChange('modules', newModules);
                                        }}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter video URL"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                                      <input
                                        type="number"
                                        value={(content as VideoContent).duration}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const newModules = [...(course.modules || [])];
                                          const newLessons = [...(newModules[moduleIndex].lessons || [])];
                                          const newContents = [...(newLessons[lessonIndex].contents || [])];
                                          (newContents[contentIndex] as VideoContent).duration = parseInt(e.target.value);
                                          newLessons[lessonIndex] = {
                                            ...newLessons[lessonIndex],
                                            contents: newContents
                                          };
                                          newModules[moduleIndex] = {
                                            ...newModules[moduleIndex],
                                            lessons: newLessons
                                          };
                                          handleCourseChange('modules', newModules);
                                        }}
                                        className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Duration"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                                      <input
                                        type="number"
                                        value={(content as VideoContent).marks}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const newModules = [...(course.modules || [])];
                                          const newLessons = [...(newModules[moduleIndex].lessons || [])];
                                          const newContents = [...(newLessons[lessonIndex].contents || [])];
                                          (newContents[contentIndex] as VideoContent).marks = parseInt(e.target.value);
                                          newLessons[lessonIndex] = {
                                            ...newLessons[lessonIndex],
                                            contents: newContents
                                          };
                                          newModules[moduleIndex] = {
                                            ...newModules[moduleIndex],
                                            lessons: newLessons
                                          };
                                          handleCourseChange('modules', newModules);
                                        }}
                                        className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Marks"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                      <button
                                        onClick={() => openEditor(moduleIndex, lessonIndex, contentIndex, 'description')}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left"
                                      >
                                        {(content as VideoContent).description || 'Add description...'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {content.type === 'article' && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Article URL</label>
                                      <input
                                        type="text"
                                        value={(content as ArticleContent).url}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const newModules = [...(course.modules || [])];
                                          const newLessons = [...(newModules[moduleIndex].lessons || [])];
                                          const newContents = [...(newLessons[lessonIndex].contents || [])];
                                          (newContents[contentIndex] as ArticleContent).url = e.target.value;
                                          newLessons[lessonIndex] = {
                                            ...newLessons[lessonIndex],
                                            contents: newContents
                                          };
                                          newModules[moduleIndex] = {
                                            ...newModules[moduleIndex],
                                            lessons: newLessons
                                          };
                                          handleCourseChange('modules', newModules);
                                        }}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter article URL"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                                      <input
                                        type="number"
                                        value={(content as ArticleContent).marks}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const newModules = [...(course.modules || [])];
                                          const newLessons = [...(newModules[moduleIndex].lessons || [])];
                                          const newContents = [...(newLessons[lessonIndex].contents || [])];
                                          (newContents[contentIndex] as ArticleContent).marks = parseInt(e.target.value);
                                          newLessons[lessonIndex] = {
                                            ...newLessons[lessonIndex],
                                            contents: newContents
                                          };
                                          newModules[moduleIndex] = {
                                            ...newModules[moduleIndex],
                                            lessons: newLessons
                                          };
                                          handleCourseChange('modules', newModules);
                                        }}
                                        className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Marks"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                                      <button
                                        onClick={() => openEditor(moduleIndex, lessonIndex, contentIndex, 'content')}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left"
                                      >
                                        {(content as ArticleContent).content || 'Add content...'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={() => console.log('Save course:', course)}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Course
          </button>
        </div>
      </div>

      {/* Only render RichTextEditor when isEditorOpen is true */}
      {isEditorOpen && currentContent && (
        <div>
          <RichTextEditor
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            value={currentContent.field === 'content'
              ? (course.modules?.[currentContent.moduleIndex]?.lessons?.[currentContent.lessonIndex]?.contents?.[currentContent.contentIndex] as ArticleContent)?.content || ''
              : (course.modules?.[currentContent.moduleIndex]?.lessons?.[currentContent.lessonIndex]?.contents?.[currentContent.contentIndex] as VideoContent | QuizContentType)?.description || ''
            }
            onChange={handleEditorChange}
            title={currentContent.field === 'content' ? 'Edit Content' : 'Edit Description'}
          />
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;