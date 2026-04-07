'use client';
import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ChangeEvent, DragEvent } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { FormOption } from '../types';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

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
}: FormInputProps) => {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-foreground mb-2">
          {label}
          {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          className={`w-full px-4 py-3 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-error focus:ring-error/30 bg-error/5'
              : 'border-muted/30 focus:ring-focus/30 focus:border-focus'
          } ${disabled ? 'bg-muted/10 text-muted cursor-not-allowed opacity-70' : 'bg-surface text-foreground'}`}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <AlertCircle className="w-5 h-5 text-error" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-error text-sm mt-1.5 flex items-center gap-1 font-medium">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-muted text-xs mt-1.5 leading-relaxed">
          {hint}
        </p>
      )}
      {maxLength && (
        <p className="text-muted text-xs mt-1.5 text-right font-medium" aria-hidden="true">
          {String(value || '').length} / {maxLength}
        </p>
      )}
    </div>
  );
};

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

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
}: FormTextareaProps) => {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-foreground mb-2">
          {label}
          {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
            error
              ? 'border-error focus:ring-error/30 bg-error/5'
              : 'border-muted/30 focus:ring-focus/30 focus:border-focus'
          } ${disabled ? 'bg-muted/10 text-muted cursor-not-allowed opacity-70' : 'bg-surface text-foreground'}`}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-3 pointer-events-none">
            <AlertCircle className="w-5 h-5 text-error" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-error text-sm mt-1.5 flex items-center gap-1 font-medium">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-muted text-xs mt-1.5 leading-relaxed">
          {hint}
        </p>
      )}
      {maxLength && (
        <p className="text-muted text-xs mt-1.5 text-right font-medium" aria-hidden="true">
          {String(value || '').length} / {maxLength}
        </p>
      )}
    </div>
  );
};

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  name: string;
  options: FormOption[];
  error?: string;
  placeholder?: string;
}

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
}: FormSelectProps) => {
  const errorId = `${name}-error`;

  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-foreground mb-2">
          {label}
          {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-4 py-3 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none ${
            error
              ? 'border-error focus:ring-error/30 bg-error/5 pr-10'
              : 'border-muted/30 focus:ring-focus/30 focus:border-focus'
          } ${disabled ? 'bg-muted/10 text-muted cursor-not-allowed opacity-70' : 'bg-surface text-foreground'}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle className="w-5 h-5 text-error" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-error text-sm mt-1.5 flex items-center gap-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

interface FormAlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

// Alert messages
export const FormAlert = ({ type = 'error', message, onClose }: FormAlertProps) => {
  const styles: Record<string, string> = {
    error: 'bg-error/10 border-error/20 text-error',
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    info: 'bg-primary/10 border-primary/20 text-primary',
  };

  const icons: Record<string, React.ReactNode> = {
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    info: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  };

  return (
    <div 
      role="alert"
      className={`p-4 border rounded-xl flex items-start gap-3 mb-4 shadow-sm ${styles[type]}`}
    >
      {icons[type]}
      <div className="flex-1">
        <p className="text-sm font-medium leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-xl leading-none opacity-60 hover:opacity-100 transition-opacity p-1 -m-1 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg focus:ring-2 focus:ring-current"
          aria-label="Fechar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

// Loading spinner
export const LoadingSpinner = ({ size = 'md', text = 'Carregando...' }: LoadingSpinnerProps) => {
  const sizes: Record<string, string> = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4" role="status" aria-live="polite">
      <div className={`${sizes[size]} border-primary/20 border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-muted text-sm mt-3 font-medium">{text}</p>}
      <span className="sr-only">Carregando conteúdo</span>
    </div>
  );
};

interface FormFileUploadProps {
  label?: string;
  onFilesSelected?: (files: File[]) => void;
  error?: string;
  maxFiles?: number;
  acceptedTypes?: string;
  required?: boolean;
  preview?: boolean;
}

// File upload with preview
export const FormFileUpload = ({
  label,
  onFilesSelected,
  error,
  maxFiles = 5,
  acceptedTypes = 'image/*',
  required = false,
  preview = true,
}: FormFileUploadProps) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
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

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesSelected?.(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-purple-50', 'border-purple-500');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-purple-50', 'border-purple-500');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all min-h-[160px] flex flex-col items-center justify-center ${
          error
            ? 'border-error/50 bg-error/5'
            : 'border-muted/30 hover:border-focus hover:bg-focus/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 group"
          aria-label={label || "Carregar arquivos"}
        >
          <div className="text-4xl mb-1 group-hover:scale-110 transition-transform" aria-hidden="true">📸</div>
          <p className="font-semibold text-foreground">Clique para carregar ou arraste as imagens</p>
          <p className="text-xs text-muted font-medium">{files.length} / {maxFiles} imagens selecionadas</p>
        </button>
      </div>

      {error && (
        <p className="text-error text-sm mt-2 flex items-center gap-1 font-medium">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

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
                className="absolute -top-2 -right-2 bg-error text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                aria-label="Remover imagem"
              >
                <span className="text-xl" aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
