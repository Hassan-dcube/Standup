import {
  ArrowUpTrayIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const AIMediaAnalyzer = ({
  instructions,
  output_schema,
  files,
  onResult,
  onError,
  onLoadingChange,
  onFilesChange,
  onFileUrlsChange,
  buttonText = "Upload Files",
  multipleFiles = false,
}: {
  instructions: string;
  output_schema: string;
  files?: File[];
  buttonText?: string;
  multipleFiles?: boolean;
  onResult: (result: any) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onFilesChange?: (files: File[]) => void;
  onFileUrlsChange?: (urls: string[]) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filesToAnalyze =
      uploadedFiles.length > 0 ? uploadedFiles : files || [];
    if (instructions && output_schema && filesToAnalyze.length > 0) {
      uploadFilesToAnalyze(filesToAnalyze);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructions, output_schema, files, uploadedFiles]);

  const uploadFilesToAnalyze = async (filesToAnalyze: File[]) => {
    if (!instructions || !output_schema || filesToAnalyze.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      if (onLoadingChange) onLoadingChange(true);

      // Create FormData to send files directly to backend
      const formData = new FormData();

      // Add files to FormData
      filesToAnalyze.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Add metadata
      formData.append("instructions", instructions);
      formData.append("output_schema", output_schema);
      formData.append("file_count", filesToAnalyze.length.toString());

      // Send FormData directly to your Python backend endpoint
      const response = await fetch(
        "https://noodle-python-apis-410534973901.us-central1.run.app/analyze_content",
        {
          method: "POST",
          body: formData, // No Content-Type header - browser sets it automatically
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the response field from the backend's response object
      if (data.success && data.response) {
        if (onResult) onResult(data.response);
      } else {
        const errorMsg = data.error || "Analysis failed";
        if (onError) onError(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Error analyzing content: " + (err as Error).message;
      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const selectedFiles = Array.from(event.target.files);

      if (multipleFiles) {
        setUploadedFiles(selectedFiles);
      } else {
        // If multiple files aren't allowed, just take the first one
        setUploadedFiles([selectedFiles[0]]);
      }

      if (onFilesChange)
        onFilesChange(multipleFiles ? selectedFiles : [selectedFiles[0]]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);

      if (multipleFiles) {
        setUploadedFiles(droppedFiles);
      } else {
        // If multiple files aren't allowed, just take the first one
        setUploadedFiles([droppedFiles[0]]);
      }

      if (onFilesChange)
        onFilesChange(multipleFiles ? droppedFiles : [droppedFiles[0]]);
    }
  };

  const clearFiles = (e: React.MouseEvent) => {
    // Prevent event propagation
    e.preventDefault();
    e.stopPropagation();

    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Also notify parent component that files were cleared
    if (onFilesChange) onFilesChange([]);
    if (onFileUrlsChange) onFileUrlsChange([]);
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    // Prevent event propagation
    e.preventDefault();
    e.stopPropagation();

    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    if (onFilesChange) onFilesChange(newFiles);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent default behavior first to avoid form submission
    e.preventDefault();
    // Prevent event propagation to avoid closing the modal
    e.stopPropagation();

    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <PhotoIcon className="h-5 w-5 text-[#4A4458]" />;
    }
    return <DocumentIcon className="h-5 w-5 text-[#4A4458]" />;
  };

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      {uploadedFiles.length > 0 ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              {uploadedFiles.length}{" "}
              {uploadedFiles.length === 1 ? "file" : "files"} selected
            </span>
            <button
              type="button"
              className="text-sm px-2 py-1 rounded-lg text-gray-600 hover:text-[#B8860B] hover:bg-gray-50 transition-colors duration-200"
              onClick={clearFiles}
              disabled={isLoading}
            >
              Clear all
            </button>
          </div>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:border-[#B8860B]/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <span className="max-w-[250px] truncate text-sm text-gray-700">
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-full text-gray-500 hover:text-[#B8860B] hover:bg-gray-50 transition-colors duration-200"
                  onClick={(e) => removeFile(index, e)}
                  disabled={isLoading}
                  aria-label="Remove file"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 1 }}
          className="mb-6 border border-gray-200 rounded-lg p-6 text-center transition-all duration-200 hover:border-[#B8860B]/40 hover:shadow-sm"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#B8860B] border border-gray-200 rounded-lg hover:border-[#B8860B] hover:bg-gray-50 transition-colors duration-200"
            onClick={handleButtonClick}
          >
            <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
            {buttonText}
          </button>
          <p className="mt-3 text-xs text-gray-500">
            {multipleFiles
              ? "Drag and drop multiple files, or click to select files"
              : "Drag and drop a file, or click to select a file"}
          </p>
        </motion.div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        disabled={isLoading}
        multiple={multipleFiles}
      />

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-3 text-center rounded-lg bg-gray-50"
        >
          <div className="flex items-center justify-center space-x-2">
            <div
              className="h-2 w-2 bg-[#B8860B] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="h-2 w-2 bg-[#B8860B] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="h-2 w-2 bg-[#B8860B] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Analyzing content...</p>
        </motion.div>
      )}
    </div>
  );
};

export default AIMediaAnalyzer;
