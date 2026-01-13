import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiXCircle,
  FiTag,
  FiLock,
  FiLoader
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/tickets';
import { Ticket, TicketMessage, Attachment } from '../../types/ticket';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import { FileUpload } from '../../components/common/FileUpload';
import { AttachmentViewer } from '../../components/common/AttachmentViewer';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [addingMessage, setAddingMessage] = useState(false);
  const [isInternalMessage, setIsInternalMessage] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      const [ticketData, messagesData, attachmentsData] = await Promise.all([
        ticketService.getTicket(parseInt(id!)),
        ticketService.getTicketMessages(parseInt(id!)),
        ticketService.getTicketAttachments(parseInt(id!))
      ]);

      setTicket(ticketData);
      setMessages(messagesData);
      setAttachments(attachmentsData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    setAddingMessage(true);
    try {
      const message = await ticketService.addTicketMessage(ticket.id, newMessage, isInternalMessage);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setIsInternalMessage(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add message');
    } finally {
      setAddingMessage(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Ticket['status']) => {
    if (!ticket) return;

    try {
      const updatedTicket = await ticketService.updateTicketStatus(ticket.id, newStatus);
      setTicket(updatedTicket);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!ticket || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(file =>
        ticketService.uploadAttachment(ticket.id, file)
      );

      const newAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, filename: string) => {
    try {
      const blob = await ticketService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to download file');
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await ticketService.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete attachment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-6xl mb-4 flex justify-center">
          <FiXCircle />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ticket</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate('/tickets')} className="btn btn-primary">
          Back to Tickets
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4 flex justify-center">
          <FiTag />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
        <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/tickets')} className="btn btn-primary">
          Back to Tickets
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || ticket.user_id === user?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="h-5 w-5 mr-2" />
          Back to Tickets
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <span className={`badge badge-${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`badge badge-${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {ticket.ticket_number} • Created {formatDate(ticket.created_at)} •
              Category: <span className="capitalize">{ticket.category}</span>
            </p>
          </div>

          {isAdmin && (
            <div className="flex space-x-2">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusUpdate(e.target.value as Ticket['status'])}
                className="form-input text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}
        </div>

        <div className="prose max-w-none">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      </div>

      {/* Attachments */}
      {(attachments.length > 0 || canEdit) && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>

          <AttachmentViewer
            attachments={attachments}
            onDownload={handleDownloadAttachment}
            onDelete={isAdmin ? handleDeleteAttachment : undefined}
            canDelete={isAdmin}
          />

          {canEdit && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Add More Files</h4>
              <FileUpload
                onFilesChange={handleFileUpload}
                maxFiles={5}
                maxSize={5 * 1024 * 1024}
                acceptedTypes={['image/*', '.pdf', '.doc', '.docx', '.txt', '.log']}
              />
              {uploadingFiles && (
                <div className="mt-3 flex items-center text-sm text-blue-600">
                  <FiLoader className="animate-spin -ml-1 mr-3 h-4 w-4" />
                  Uploading files...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages/Chat */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Conversation
        </h3>

        {/* Messages List */}
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          <div className="space-y-4 mb-6">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-lg p-4 ${message.is_internal
                ? 'bg-yellow-50 border-l-4 border-yellow-400 border border-yellow-200'
                : message.user?.role === 'admin'
                  ? 'bg-blue-50 border-l-4 border-blue-400'
                  : 'bg-gray-50 border-l-4 border-gray-400'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {message.user?.name || 'Unknown User'}
                    </span>
                    <span className={`badge ${message.user?.role === 'admin' ? 'badge-blue' : 'badge-gray'
                      }`}>
                      {message.user?.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    {message.is_internal && (
                      <span className="badge badge-yellow">
                        <FiLock className="inline mr-1" /> Internal Note
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                {message.is_internal && (
                  <p className="text-xs text-yellow-700 mt-2 italic font-medium">
                    <FiLock className="inline mr-1" /> This note is only visible to administrators
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Message Form */}
        {canEdit && (
          <form onSubmit={handleAddMessage} className="border-t pt-4">
            <div className="mb-3">
              <label htmlFor="message" className="form-label">
                Add Message
              </label>
              <textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="form-input"
                placeholder="Type your message..."
              />
            </div>

            {/* Internal message checkbox for admins */}
            {isAdmin && (
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isInternalMessage}
                    onChange={(e) => setIsInternalMessage(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Make this an internal note (only visible to admins)
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={!newMessage.trim() || addingMessage}
              className={`btn ${isInternalMessage ? 'btn-secondary' : 'btn-primary'}`}
            >
              {addingMessage ? 'Sending...' : (isInternalMessage ? 'Add Internal Note' : 'Send Message')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};