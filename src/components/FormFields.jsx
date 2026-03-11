import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Input field with validation
export const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  maxLength,
  hint,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-500 focus:ring-red-300 bg-red-50'
              : 'border-gray-300 focus:ring-purple-300 focus:border-purple-500'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
          {...props}
        />
        {error && <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
      {maxLength && (
        <p className="text-gray-400 text-xs mt-1">
          {value?.length || 0}/{maxLength}
        </p>
      )}
    </div>
  );
};

// Textarea field with character counter
export const FormTextarea = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  maxLength,
  rows = 4,
  hint,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
            error
              ? 'border-red-500 focus:ring-red-300 bg-red-50'
              : 'border-gray-300 focus:ring-purple-300 focus:border-purple-500'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
      {maxLength && (
        <p className="text-gray-400 text-xs mt-1">
          {value?.length || 0}/{maxLength}
        </p>
      )}
    </div>
  );
};

// Select/dropdown field
export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  placeholder,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-500 focus:ring-red-300 bg-red-50'
            : 'border-gray-300 focus:ring-purple-300 focus:border-purple-500'
        } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Alert messages
export const FormAlert = ({ type = 'error', message, onClose }) => {
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div className={`p-4 border rounded-lg flex items-center justify-between mb-4 ${colors[type]}`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lg font-bold cursor-pointer">
          ×
        </button>
      )}
    </div>
  );
};

// Loading spinner
export const LoadingSpinner = ({ size = 'md', text = 'Carregando...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizes[size]} border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin`} />
      {text && <p className="text-gray-600 text-sm mt-2">{text}</p>}
    </div>
  );
};

// File upload with preview
export const FormFileUpload = ({
  label,
  onFilesSelected,
  error,
  maxFiles = 5,
  acceptedTypes = 'image/*',
  required = false,
  preview = true,
}) => {
  const [files, setFiles] = React.useState([]);
  const [previews, setPreviews] = React.useState([]);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length + files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} imagens permitidas`);
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    if (preview) {
      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }

    onFilesSelected?.(newFiles);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesSelected?.(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-purple-50', 'border-purple-500');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-purple-50', 'border-purple-500');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-purple-50', 'border-purple-500');
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      droppedFiles.forEach((file) => dataTransfer.items.add(file));
      input.files = dataTransfer.files;
      handleFileChange({ target: { files: dataTransfer.files } });
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-gray-600 hover:text-purple-600"
        >
          <div className="text-4xl mb-2">📸</div>
          <p className="font-medium">Clique para carregar ou arraste as imagens</p>
          <p className="text-xs text-gray-500 mt-1">{files.length}/{maxFiles} imagens selecionadas</p>
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {preview && previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative group">
              <img
                src={src}
                alt={`Preview ${index}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
