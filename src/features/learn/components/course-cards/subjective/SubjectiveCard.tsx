import React, { useRef, useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';
import { submitContent } from "../../../../../services/courses-content/submitApis";
import { useNavigate } from "react-router-dom";

interface AssignmentData {
  id: number;
  content_title: string;
  content_type: string;
  duration_in_minutes: number;
  order: number;
  status?: string;
  details: {
    id: number;
    title: string;
    question: string;
    difficulty_level: string;
  };
}

interface SubjectiveCardProps {
  contentId: number;
  courseId: number;
}

const SubjectiveCard: React.FC<SubjectiveCardProps> = ({ contentId, courseId }) => {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(14);
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [textColor, setTextColor] = useState("#2D3748");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);

  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Common colors for the color picker
  const colorOptions = [
    "#2D3748", // Default dark gray/blue
    "#E53E3E", // Red
    "#DD6B20", // Orange
    "#D69E2E", // Yellow
    "#38A169", // Green
    "#319795", // Teal
    "#3182CE", // Blue
    "#805AD5", // Purple
    "#D53F8C", // Pink
    "#000000"  // Black
  ];

  const { data, isLoading, error } = useQuery<AssignmentData>({
    queryKey: ['assignment', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });

  console.log('Assignment Data:', data);
  // Check if content is empty to show/hide placeholder
  useEffect(() => {
    if (editorRef.current) {
      const isEmpty = !answer || answer.trim() === "" ||
        answer === "<div></div>" ||
        answer === "<br>" ||
        answer === "<p></p>";
      setShowPlaceholder(isEmpty);
    }
  }, [answer]);

  // Add click-away listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontSizeDropdownRef.current &&
        !fontSizeDropdownRef.current.contains(event.target as Node)) {
        setFontSizeDropdownOpen(false);
      }

      if (colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Execute formatting command on the editor content
  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setShowPlaceholder(false);
    }
  };

  // Handle text color change
  const handleColorChange = (color: string) => {
    setTextColor(color);
    execCommand("foreColor", color);
    setShowColorPicker(false);
  };

  // Font size options
  const fontSizeOptions = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];

  // Handle font size change
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    execCommand("fontSize", (size / 4).toString());
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/6 mb-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading assignment. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 p-4">
        No assignment data available.
      </div>
    );
  }

  console.log('Assignment Data:', data);
  console.log("answer", answer);
  const handleSubmit = async () => {
    // Handle submission logic here
    const response = await submitContent(1, courseId, contentId, "Assignment", { answer });
    console.log("response", response);
    if (response === 201) {
      console.log('Submitted answer:', answer);
      navigate(0);
    } else {
      console.log("error", response);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
      {/* <BackToHomeButton /> */}

      <div className="mt-8">
        <h1 className="text-2xl font-semibold">{data.content_title}</h1>

        <div className="flex items-center gap-4 mt-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100">
            <span className={`material-icons text-sm mr-1 ${
              data.details.difficulty_level === 'Easy' ? 'text-green-800' :
              data.details.difficulty_level === 'Medium' ? 'text-yellow-800' :
              'text-red-800'
            }`}>bolt</span>
            <span className="text-sm">{data.details.difficulty_level}</span>
          </div>

          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100">
            <span className="material-icons text-sm mr-1">bar_chart</span>
            <span className="text-sm">{data.duration_in_minutes} minutes</span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium">Question</h2>
          <div className="mt-2 text-gray-700">
            {data.details.question}
          </div>
        </div>

        {/* <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Selection of Vehicle Models:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Choose one electric supercar and one IC engine supercar (or road-legal production cars). Specific models should be selected, not a general comparison.</li>
          </ol>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Parameter-Based Comparison:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <strong>Performance:</strong> Compare motor power, battery capacity, top speed, acceleration time, range, mileage, and power-to-weight ratio with numbers.
            </li>
            <li>
              <strong>Cost:</strong> Compare buying price and running cost (mileage) in the same currency.
            </li>
            <li>
              <strong>Environmental Impact:</strong> Evaluate emissions.
            </li>
            <li>
              <strong>Maintenance and Repairs:</strong> Compare annual maintenance and repair costs with estimated values.
            </li>
            <li>
              <strong>Comfort and Convenience:</strong> Compare interior design, special features, and technology.
            </li>
            <li>
              <strong>Driving Experience:</strong> Analyze transmission type, sound, feel, and handling.
            </li>
          </ol>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Tabular Comparison and Presentation:</h2>
          <p>Use tables for numerical comparisons and include relevant images of both vehicles.</p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Conclusion:</h2>
          <p>Provide a subjective but logical conclusion summarizing the advantages and disadvantages of each vehicle.</p>
        </div> */}

        {/* Text Box */}
        <div className="mt-8">
          <h2 className="text-xl font-medium">Your Answer</h2>
          <div className="border rounded-lg overflow-hidden mt-3">
            <div className="bg-[#D7EFF6] px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center relative" ref={fontSizeDropdownRef}>
                <div
                  className="text-sm flex items-center cursor-pointer"
                  onClick={() => setFontSizeDropdownOpen(!fontSizeDropdownOpen)}
                >
                  <span>{fontSize}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {fontSizeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border overflow-y-auto z-10 max-h-48">
                    {fontSizeOptions.map((size) => (
                      <div
                        key={size}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handleFontSizeChange(size);
                          setFontSizeDropdownOpen(false);
                        }}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button className="text-[#2D3748] font-bold cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("formatBlock", "h1")}>T</button>

                <div className="relative" ref={colorPickerRef}>
                  <div
                    className="h-6 w-6 rounded-full cursor-pointer border border-gray-300"
                    style={{ backgroundColor: textColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  ></div>

                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border p-2 z-10 grid grid-cols-5 gap-1">
                      {colorOptions.map((color) => (
                        <div
                          key={color}
                          className="h-5 w-5 rounded-full cursor-pointer border border-gray-300"
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(color)}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="font-bold cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("bold")}>B</button>

                <button className="italic font-medium cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("italic")}>I</button>

                <button className="underline font-medium cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("underline")}>U</button>

                <button className="font-medium line-through cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("strikeThrough")}>S</button>

                <div className="h-4 border-r border-gray-300"></div>

                <button className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("justifyLeft")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16" />
                  </svg>
                </button>

                <button className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("justifyCenter")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8" />
                  </svg>
                </button>

                <button className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("justifyFull")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="h-4 border-r border-gray-300"></div>

                <button className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => execCommand("insertOrderedList")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>

                <button className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => {
                  const date = new Date().toLocaleDateString();
                  execCommand("insertText", date);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                <button className="cursor-pointer hover:bg-gray-200 p-1 rounded" onClick={() => {
                  const url = prompt("Enter the URL:");
                  if (url) execCommand("createLink", url);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative">
              <div
                ref={editorRef}
                className="w-full p-4 min-h-[300px] focus:outline-none text-gray-700 overflow-auto"
                contentEditable
                onInput={(e) => {
                  setAnswer(e.currentTarget.innerHTML);
                  setShowPlaceholder(e.currentTarget.innerHTML.trim() === '' ||
                    e.currentTarget.innerHTML === '<br>' ||
                    e.currentTarget.innerHTML === '<div></div>' ||
                    e.currentTarget.innerHTML === '<p></p>');
                }}
                onFocus={() => {
                  if (showPlaceholder) {
                    setShowPlaceholder(false);
                  }
                }}
                onBlur={() => {
                  if (editorRef.current?.innerHTML.trim() === '' ||
                    editorRef.current?.innerHTML === '<br>' ||
                    editorRef.current?.innerHTML === '<div></div>' ||
                    editorRef.current?.innerHTML === '<p></p>') {
                    setShowPlaceholder(true);
                  }
                }}
                suppressContentEditableWarning={true}
                dangerouslySetInnerHTML={{ __html: answer }}
              />
              {showPlaceholder && (
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                  Type your answers here...
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              className={`px-12 py-3 rounded-lg font-medium ${
                !answer.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#255C79] text-white hover:bg-[#1a4a5f] transition-colors'
              }`}
              onClick={handleSubmit}
              disabled={!answer.trim()}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectiveCard; 