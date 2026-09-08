import { useRef, useState } from 'react';
import clsx from 'clsx';

const DOC_TYPE_LABELS = {
  ssc: 'SSC Memo',
  '12th': '12th Memo',
  degree: 'Degree Certificate',
  aadhar: 'Aadhaar Card',
  pan: 'PAN Card',
  resume: 'Resume',
  offer_letter: 'Offer Letter',
  other: 'Other Document',
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload({ onFileSelect, accept, label, docType, progress, uploaded, error: externalError }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const displayLabel = docType ? (DOC_TYPE_LABELS[docType] || label) : label;

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, JPEG, PNG, DOCX files allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File size must be under 10MB.');
      return;
    }

    setError('');
    setFileName(file.name);
    onFileSelect(file);
  }

  return (
    <div className="flex flex-col gap-1">
      {displayLabel && (
        <label className="text-sm font-medium text-gray-700">{displayLabel}</label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors',
          uploaded ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50',
          (error || externalError) && 'border-red-400 bg-red-50'
        )}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${displayLabel}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept || '.pdf,.jpg,.jpeg,.png,.docx'}
          className="hidden"
          onChange={handleChange}
        />

        {uploaded ? (
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium truncate">{fileName || 'Uploaded'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm">{fileName || `Click to upload ${displayLabel || 'file'}`}</span>
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && progress < 100 && (
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>

      {(error || externalError) && (
        <p role="alert" className="text-xs text-red-600">{error || externalError}</p>
      )}
    </div>
  );
}
