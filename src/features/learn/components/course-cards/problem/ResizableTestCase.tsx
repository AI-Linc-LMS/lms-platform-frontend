import React, { useRef, useState, useEffect } from 'react';

interface ResizableBoxProps {
  startResizing: () => void;
  isConsoleOpen: boolean;
  activeConsoleTab: string;
  setActiveConsoleTab: (tab: string) => void;
  consoleHeight: number;
  setConsoleHeight: (height: number) => void;
  testCases: any[];
  customInput: string;
  setCustomInput: (customInput: string) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  results: any;
  setResults: (results: any) => void;
}

const ResizableBox: React.FC<ResizableBoxProps> = ({
  startResizing,
  isConsoleOpen,
  activeConsoleTab,
  setActiveConsoleTab,
  consoleHeight,
  testCases,
  customInput,
  setCustomInput,
  isRunning,
  setIsRunning,
  results,
  setResults
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(200);
  const [top, setTop] = useState(100); // Initial top position
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [startTop, setStartTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    setStartTop(top);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = e.clientY - startY;
    const newHeight = startHeight - deltaY;
    const newTop = startTop + deltaY;

    if (newHeight > 50) {
      setHeight(newHeight);
      setTop(newTop);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startY, startHeight, startTop]);

  return (
    <div
      ref={boxRef}
      style={{
        width: '300px',
        height: `${height}px`,
        top: `${top}px`,
        position: 'absolute',
        left: '800px',
        border: '2px solid #444',
        background: '#f0f0f0',
      }}
    >
      {/* Drag handle on top */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: '8px',
          cursor: 'ns-resize',
          backgroundColor: '#888',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      />
      
      { (
      <>
              <div className="console-resize-handle" onMouseDown={startResizing}></div>
              <div className="console-panel" style={{ height: `${consoleHeight}px` }}>
                <div className="console-tabs">
                  <button
                    className={`console-tab ${activeConsoleTab === 'testcases' ? 'active' : ''}`}
                    onClick={() => setActiveConsoleTab('testcases')}
                  >
                    Test Cases
                  </button>
                  <button
                    className={`console-tab ${activeConsoleTab === 'customInput' ? 'active' : ''}`}
                    onClick={() => setActiveConsoleTab('customInput')}
                  >
                    Custom Input
                  </button>
                  <button
                    className={`console-tab ${activeConsoleTab === 'console' ? 'active' : ''}`}
                    onClick={() => setActiveConsoleTab('console')}
                  >
                    Console
                  </button>
                </div>

                <div className="console-content">
                  {activeConsoleTab === 'testcases' && (
                    <div className="testcases-content">
                      {testCases.map((testCase, index) => (
                        <div key={index} className={`testcase ${testCase.status}`}>
                          <div className="testcase-header">
                            <div className="testcase-title">
                              Test Case {index + 1}
                              {testCase.status && (
                                <span className={`testcase-status ${testCase.status}`}>
                                  {testCase.status === 'passed' ? '✓ Passed' :
                                    testCase.status === 'failed' ? '✗ Failed' :
                                      '⟳ Running'}
                                </span>
                              )}
                            </div>
                            <button className="testcase-expand">▼</button>
                          </div>
                          <div className="testcase-details">
                            <div className="testcase-section">
                              <div className="testcase-label">Input:</div>
                              <pre className="testcase-value">{testCase.input}</pre>
                            </div>
                            <div className="testcase-section">
                              <div className="testcase-label">Expected Output:</div>
                              <pre className="testcase-value">{testCase.expectedOutput}</pre>
                            </div>
                            {testCase.userOutput && (
                              <div className="testcase-section">
                                <div className="testcase-label">Your Output:</div>
                                <pre className="testcase-value">{testCase.userOutput}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeConsoleTab === 'customInput' && (
                    <div className="custom-input-content">
                      <div className="custom-input-wrapper">
                        <textarea
                          className="custom-input-textarea"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Enter your custom input here..."
                        />
                      </div>
                      <div className="custom-input-actions">
                        <button
                          className="custom-input-run"
                          onClick={() => {
                            // Simulate running with custom input
                            setIsRunning(true);
                            setTimeout(() => {
                              setIsRunning(false);
                              setResults({
                                success: true,
                                message: "Custom input test passed!",
                              });
                            }, 1000);
                          }}
                          disabled={isRunning}
                        >
                          Run
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConsoleTab === 'console' && (
                    <div className="console-output">
                      {results && (
                        <div className={`results ${results.success ? 'success' : 'error'}`}>
                          {results.message}
                        </div>
                      )}
                      <div className="console-log">
                        {/* Console output would be displayed here */}
                        {isRunning ? 'Executing code...' : '> Console output will appear here'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
      )}
    </div>
  );
};

export default ResizableBox;
