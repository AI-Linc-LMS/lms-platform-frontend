import React, { ReactElement } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  onClose: () => void;
  isOpen: boolean;
}

const RichTextEditor = ({
  value,
  onChange,
  title,
  onClose,
  isOpen,
}: RichTextEditorProps): ReactElement | null => {
  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;

  if (!isOpen) return null;

  if (!apiKey) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">TinyMCE API Key Required</h2>
          <p className="text-gray-600 mb-4">
            Please add your TinyMCE API key to the .env file:
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg mb-4">
            VITE_TINYMCE_API_KEY=your-api-key-here
          </pre>
          <p className="text-gray-600 mb-4">
            You can get a free API key from{' '}
            <a
              href="https://www.tiny.cloud/auth/signup/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              https://www.tiny.cloud/auth/signup/
            </a>
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-4/5 h-4/5 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4">
          <Editor
            apiKey={apiKey}
            value={value}
            onEditorChange={(content) => onChange(content)}
            init={{
              height: '100%',
              menubar: true,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
                'template', 'codesample', 'hr', 'pagebreak', 'nonbreaking', 'toc',
                'visualchars', 'quickbars', 'emoticons', 'codesample', 'help'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help | image media table codesample | ' +
                'fontfamily fontsize | emoticons | fullscreen | ' +
                'link anchor | charmap | preview | searchreplace | ' +
                'visualblocks visualchars | pagebreak nonbreaking | ' +
                'template | toc | quickbars',
              content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
              skin: 'oxide',
              content_css: 'default',
              branding: false,
              promotion: false,
              resize: false,
              min_height: 500,
              max_height: 800,
              automatic_uploads: true,
              file_picker_types: 'image media',
              images_upload_url: '/upload', // You'll need to implement this endpoint
              images_upload_handler: async (blobInfo) => {
                // You'll need to implement this function to handle image uploads
                return new Promise((resolve) => {
                  resolve('https://example.com/image.jpg');
                });
              },
              setup: (editor) => {
                editor.on('init', () => {
                  editor.getContainer().style.transition = "border-color 0.15s ease-in-out";
                });
                editor.on('focus', () => {
                  editor.getContainer().style.borderColor = "#3b82f6";
                });
                editor.on('blur', () => {
                  editor.getContainer().style.borderColor = "#e5e7eb";
                });
              },
            }}
          />
        </div>
        <div className="p-4 border-t flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor; 