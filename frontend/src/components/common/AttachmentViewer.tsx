import React, { useState } from 'react';
import { 
  FiImage, 
  FiFile, 
  FiFileText, 
  FiArchive, 
  FiPaperclip,
  FiEye,
  FiDownload,
  FiTrash2
} from 'react-icons/fi';
import { Attachment } from '../../types/ticket';
import { formatDate } from '../../utils/helpers';
import { Modal } from './Modal';

interface AttachmentViewerProps {
  attachments: Attachment[];
  onDownload: (attachmentId: number, filename: string) => void;
  onDelete?: (attachmentId: number) => void;
  canDelete?: boolean;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  onDownload,
  onDelete,
  canDelete = false
}) => {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateFilename = (filename: string, maxLength: number = 30): string => {
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    
    if (extension) {
      const maxNameLength = maxLength - extension.length - 4; // -4 for "..." and "."
      if (maxNameLength > 0) {
        return `${nameWithoutExt.substring(0, maxNameLength)}...${extension}`;
      }
    }
    
    return `${filename.substring(0, maxLength - 3)}...`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FiImage className="text-2xl" />;
    if (mimeType.includes('pdf')) return <FiFile className="text-2xl" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FiFileText className="text-2xl" />;
    if (mimeType.includes('text')) return <FiFileText className="text-2xl" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <FiArchive className="text-2xl" />;
    return <FiPaperclip className="text-2xl" />;
  };

  const isPreviewable = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') || 
           mimeType.includes('pdf') || 
           mimeType.includes('text/');
  };

  const handlePreview = async (attachment: Attachment) => {
    if (!isPreviewable(attachment.mime_type)) return;
    
    try {
      // For images, we can create a preview URL
      if (attachment.mime_type.startsWith('image/')) {
        // In a real implementation, you'd fetch the image blob and create an object URL
        // For now, we'll use the download endpoint
        const response = await fetch(`/api/attachments/${attachment.id}/download`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
      setPreviewAttachment(attachment);
    } catch (error) {
      console.error('Failed to preview attachment:', error);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewAttachment(null);
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2 flex justify-center">
          <FiPaperclip />
        </div>
        <p>No attachments</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <span className="text-2xl">{getFileIcon(attachment.mime_type)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900" title={attachment.original_filename}>
                    {truncateFilename(attachment.original_filename)}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(attachment.file_size)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded {formatDate(attachment.uploaded_at)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {attachment.mime_type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-2">
                {isPreviewable(attachment.mime_type) && (
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Preview file"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  onClick={() => onDownload(attachment.id, attachment.original_filename)}
                  className="text-green-600 hover:text-green-800 p-1"
                  title="Download file"
                >
                  <FiDownload className="h-4 w-4" />
                </button>
                
                {canDelete && onDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete file"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewAttachment && (
        <Modal
          isOpen={true}
          onClose={closePreview}
          title={`Preview: ${previewAttachment.original_filename}`}
          size="xl"
        >
          <div className="space-y-4">
            {previewAttachment.mime_type.startsWith('image/') && previewUrl && (
              <div className="text-center">
                <img
                  src={previewUrl}
                  alt={previewAttachment.original_filename}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {previewAttachment.mime_type.includes('pdf') && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 flex justify-center">
                  <FiFile />
                </div>
                <p className="text-gray-600 mb-4">PDF Preview</p>
                <p className="text-sm text-gray-500">
                  PDF preview is not available in this demo. Click download to view the file.
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                <p>Size: {formatFileSize(previewAttachment.file_size)}</p>
                <p>Type: {previewAttachment.mime_type}</p>
                <p>Uploaded: {formatDate(previewAttachment.uploaded_at)}</p>
              </div>
              <button
                onClick={() => onDownload(previewAttachment.id, previewAttachment.original_filename)}
                className="btn btn-primary"
              >
                Download File
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};