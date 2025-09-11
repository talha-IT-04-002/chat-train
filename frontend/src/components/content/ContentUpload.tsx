import React, { useState, useRef } from 'react';
import { Upload, File as FileIcon, FileText, FileSpreadsheet, FileJson, Image as ImageIcon, Music2, Clapperboard, Paperclip, Wrench, CheckCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { Button, Modal } from '../index';

interface UploadedFile {
  id: string;
  file: File;
  originalName: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  extractedText?: string;
  metadata?: any;
  suggestions?: Array<{
    type: string;
    suggestion: string;
  }>;
}

interface ContentUploadProps {
  trainerId: string;
  onContentUploaded?: (files: UploadedFile[]) => void;
  onGenerateFlow?: (files: UploadedFile[]) => void;
}

const ContentUpload: React.FC<ContentUploadProps> = ({
  trainerId,
  onContentUploaded,
  onGenerateFlow
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm'
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileIcon className="w-5 h-5" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="w-5 h-5" />;
    if (type.includes('text') || type.includes('markdown')) return <FileText className="w-5 h-5" />;
    if (type.includes('csv')) return <FileSpreadsheet className="w-5 h-5" />;
    if (type.includes('json')) return <FileJson className="w-5 h-5" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (type.includes('audio')) return <Music2 className="w-5 h-5" />;
    if (type.includes('video')) return <Clapperboard className="w-5 h-5" />;
    return <Paperclip className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      supportedTypes.includes(file.type) && file.size <= 50 * 1024 * 1024
    );

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      originalName: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    uploadFiles(newFiles);
  };

  const uploadFiles = async (files: UploadedFile[]) => {

    for (const fileData of files) {
      try {
        const formData = new FormData();
        formData.append('files', fileData.file);
        formData.append('trainerId', trainerId);

        const response = await fetch('/api/content/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        const result = await response.json();

        if (result.success) {
          const uploadedFile = result.data.files.find(
            (f: any) => f.originalName === fileData.originalName
          );

          if (uploadedFile) {
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileData.id 
                ? {
                    ...f,
                    status: 'success' as const,
                    progress: 100,
                    extractedText: uploadedFile.extractedText,
                    metadata: uploadedFile.metadata,
                    suggestions: uploadedFile.suggestions
                  }
                : f
            ));
          }
        } else {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { ...f, status: 'error' as const, error: result.message }
              : f
          ));
        }
      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        ));
      }
    }

    
    
    if (onContentUploaded) {
      const successfulFiles = uploadedFiles.filter(f => f.status === 'success');
      onContentUploaded(successfulFiles);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const previewFile = (file: UploadedFile) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const handleGenerateFlow = () => {
    const successfulFiles = uploadedFiles.filter(f => f.status === 'success');
    if (successfulFiles.length > 0 && onGenerateFlow) {
      onGenerateFlow(successfulFiles);
    }
  };

  const successfulUploads = uploadedFiles.filter(f => f.status === 'success').length;
  const totalUploads = uploadedFiles.length;

  return (
    <>
      <Button
        onClick={() => setShowUploadModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Training Content
      </Button>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Training Content"
        size="lg"
      >
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop your training materials here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="primary"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={supportedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Supported File Types:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
              <div className="inline-flex items-center gap-2"><FileIcon className="w-4 h-4" /> PDF Documents</div>
              <div className="inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Word Documents</div>
              <div className="inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Text Files</div>
              <div className="inline-flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> CSV Files</div>
              <div className="inline-flex items-center gap-2"><Wrench className="w-4 h-4" /> JSON Files</div>
              <div className="inline-flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Images (JPEG, PNG, GIF)</div>
              <div className="inline-flex items-center gap-2"><Music2 className="w-4 h-4" /> Audio Files</div>
              <div className="inline-flex items-center gap-2"><Clapperboard className="w-4 h-4" /> Video Files</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 50MB per file
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Uploaded Files:</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div>
                        <p className="font-medium text-sm">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {file.status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      
                      {file.status === 'success' && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-transparent hover:bg-gray-100 text-gray-700"
                          onClick={() => previewFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="error"
                        className="bg-transparent hover:bg-red-50 text-red-500"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {successfulUploads} of {totalUploads} files uploaded successfully
            </div>
            
            <div className="space-x-3">
              <Button
                variant="primary"
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              
              {successfulUploads > 0 && (
                <Button
                  onClick={handleGenerateFlow}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Generate Flow
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Preview: ${selectedFile?.originalName}`}
        size="xl"
      >
        {selectedFile && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">File Name:</span>
                  <p className="text-gray-600">{selectedFile.originalName}</p>
                </div>
                <div>
                  <span className="font-medium">File Size:</span>
                  <p className="text-gray-600">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <span className="font-medium">File Type:</span>
                  <p className="text-gray-600">{selectedFile.type}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-gray-600 capitalize">{selectedFile.status}</p>
                </div>
              </div>
            </div>

            {selectedFile.extractedText && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Extracted Content:</h4>
                <div className="bg-white border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedFile.extractedText}
                  </pre>
                </div>
              </div>
            )}

            {selectedFile.suggestions && selectedFile.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">AI Suggestions:</h4>
                <div className="space-y-2">
                  {selectedFile.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">{suggestion.type}:</span> {suggestion.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFile.metadata && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">File Metadata:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-600">
                    {JSON.stringify(selectedFile.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ContentUpload;