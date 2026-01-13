import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiXCircle, 
  FiPaperclip, 
  FiImage, 
  FiFile, 
  FiFileText,
  FiDownload,
  FiTrash2,
  FiSearch
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { api, ApiResponse } from '../../services/api';
import { Attachment } from '../../types/ticket';
import { formatDate } from '../../utils/helpers';
import { SearchBar } from '../../components/common/SearchBar';

interface AttachmentWithTicket extends Attachment {
    ticket_title?: string;
    ticket_number?: string;
}

export const AttachmentsPage: React.FC = () => {
    const { user } = useAuth();
    const [attachments, setAttachments] = useState<AttachmentWithTicket[]>([]);
    const [filteredAttachments, setFilteredAttachments] = useState<AttachmentWithTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchAllAttachments();
        }
    }, [user]);

    useEffect(() => {
        filterAttachments();
    }, [attachments, searchTerm]);

    const fetchAllAttachments = async () => {
        try {
            const response = await api.get<ApiResponse<AttachmentWithTicket[]>>('/admin/attachments');
            setAttachments(response.data.data);
        } catch (error) {
            console.error('Failed to fetch attachments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAttachments = () => {
        if (!searchTerm.trim()) {
            setFilteredAttachments(attachments);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = attachments.filter(attachment =>
            attachment.original_filename.toLowerCase().includes(term) ||
            attachment.ticket_title?.toLowerCase().includes(term) ||
            attachment.ticket_number?.toLowerCase().includes(term) ||
            attachment.mime_type.toLowerCase().includes(term)
        );
        setFilteredAttachments(filtered);
    };

    const handleDownload = async (attachmentId: number, filename: string) => {
        try {
            const response = await api.get(`/attachments/${attachmentId}/download`, {
                responseType: 'blob',
            });
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download attachment:', error);
        }
    };

    const handleDelete = async (attachmentId: number) => {
        if (!window.confirm('Are you sure you want to delete this attachment?')) return;

        try {
            await api.delete(`/attachments/${attachmentId}`);
            setAttachments(prev => prev.filter(att => att.id !== attachmentId));
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-12">
                <div className="text-red-400 text-6xl mb-4 flex justify-center">
                    <FiXCircle />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">You don't have permission to view all attachments.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Attachments</h1>
                <p className="text-gray-600">Manage all file attachments across tickets</p>
            </div>

            {/* Search */}
            <div className="card">
                <SearchBar
                    onSearch={setSearchTerm}
                    placeholder="Search attachments by filename, ticket, or file type..."
                />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{attachments.length}</div>
                        <div className="text-sm text-gray-600">Total Files</div>
                    </div>
                </div>
                <div className="card">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {attachments.filter(a => a.mime_type.startsWith('image/')).length}
                        </div>
                        <div className="text-sm text-gray-600">Images</div>
                    </div>
                </div>
                <div className="card">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {attachments.filter(a => a.mime_type.includes('pdf')).length}
                        </div>
                        <div className="text-sm text-gray-600">PDFs</div>
                    </div>
                </div>
                <div className="card">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {Math.round(attachments.reduce((sum, a) => sum + a.file_size, 0) / 1024 / 1024)}
                        </div>
                        <div className="text-sm text-gray-600">MB Total</div>
                    </div>
                </div>
            </div>

            {/* Attachments List */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Attachments ({filteredAttachments.length})
                    </h2>
                </div>

                {filteredAttachments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-4 flex justify-center">
                            <FiPaperclip />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm ? 'No attachments found' : 'No attachments yet'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? 'Try adjusting your search terms.'
                                : 'Attachments will appear here when users upload files to tickets.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAttachments.map((attachment) => (
                            <div key={attachment.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-2xl">
                                            {attachment.mime_type.startsWith('image/') ? <FiImage /> :
                                                attachment.mime_type.includes('pdf') ? <FiFile /> :
                                                    attachment.mime_type.includes('word') ? <FiFileText /> : <FiPaperclip />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {attachment.original_filename}
                                            </h3>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <p>
                                                    Size: {Math.round(attachment.file_size / 1024)} KB •
                                                    Type: {attachment.mime_type}
                                                </p>
                                                <p>
                                                    Uploaded: {formatDate(attachment.uploaded_at)}
                                                </p>
                                                {attachment.ticket_number && (
                                                    <p>
                                                        Ticket:
                                                        <Link
                                                            to={`/tickets/${attachment.ticket_id}`}
                                                            className="text-blue-600 hover:text-blue-500 ml-1"
                                                        >
                                                            {attachment.ticket_number}
                                                        </Link>
                                                        {attachment.ticket_title && ` - ${attachment.ticket_title}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleDownload(attachment.id, attachment.original_filename)}
                                            className="btn btn-secondary text-sm"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(attachment.id)}
                                            className="btn btn-danger text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};