import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTag, FiPlus } from 'react-icons/fi';
import { ticketService } from '../../services/tickets';
import { Ticket } from '../../types/ticket';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await ticketService.getTickets();
      setTickets(response);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600">Manage your support requests</p>
        </div>
        <Link to={ROUTES.CREATE_TICKET} className="btn btn-primary">
          Create New Ticket
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Tickets', count: tickets.length },
            { key: 'open', label: 'Open', count: tickets.filter(t => t.status === 'open').length },
            { key: 'in_progress', label: 'In Progress', count: tickets.filter(t => t.status === 'in_progress').length },
            { key: 'resolved', label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length },
            { key: 'closed', label: 'Closed', count: tickets.filter(t => t.status === 'closed').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4 flex justify-center">
            <FiTag />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Create your first support ticket to get started.'
              : `You don't have any ${filter.replace('_', ' ')} tickets at the moment.`
            }
          </p>
          {filter === 'all' && (
            <Link to={ROUTES.CREATE_TICKET} className="btn btn-primary">
              Create Your First Ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="block hover:bg-gray-50 px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {ticket.ticket_number}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`badge badge-${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`badge badge-${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mt-1">
                        {ticket.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span className="capitalize">{ticket.category}</span>
                        <span className="mx-2">•</span>
                        <span>Created {formatDate(ticket.created_at)}</span>
                        <span className="mx-2">•</span>
                        <span>Updated {formatDate(ticket.updated_at)}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};