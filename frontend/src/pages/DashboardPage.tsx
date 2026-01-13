import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBarChart, 
  FiUnlock, 
  FiCheckCircle, 
  FiPlus, 
  FiBook, 
  FiTag 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { api, ApiResponse } from '../services/api';
import { Ticket } from '../types/ticket';
import { KnowledgeArticle } from '../types/article';
import { ROUTES } from '../utils/constants';
import { formatDate, getStatusColor, getPriorityColor } from '../utils/helpers';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  recentTickets: Ticket[];
  popularArticles: KnowledgeArticle[];
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ticketsResponse, articlesResponse] = await Promise.all([
        api.get<ApiResponse<Ticket[]>>('/tickets'),
        api.get<ApiResponse<KnowledgeArticle[]>>('/articles?popular=true&limit=5')
      ]);

      const tickets = ticketsResponse.data.data;
      const articles = articlesResponse.data.data;

      const dashboardStats: DashboardStats = {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        recentTickets: tickets.slice(0, 5),
        popularArticles: articles
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your support tickets.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <FiBarChart className="text-white text-sm" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalTickets || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <FiUnlock className="text-white text-sm" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.openTickets || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <FiCheckCircle className="text-white text-sm" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.resolvedTickets || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            <Link
              to={ROUTES.TICKETS}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          
          {stats?.recentTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tickets yet</p>
              <Link
                to={ROUTES.CREATE_TICKET}
                className="btn btn-primary mt-4 inline-block"
              >
                Create your first ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {ticket.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {ticket.ticket_number} • {formatDate(ticket.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge badge-${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`badge badge-${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Knowledge Base Articles */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Popular Articles</h2>
            <Link
              to={ROUTES.KNOWLEDGE_BASE}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Browse all
            </Link>
          </div>
          
          {stats?.popularArticles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No articles available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.popularArticles.map((article) => (
                <div key={article.id} className="p-3 bg-gray-50 rounded-lg">
                  <Link
                    to={`/knowledge/${article.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 block"
                  >
                    {article.title}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{article.category}</span>
                    <span className="text-xs text-gray-500">{article.view_count} views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={ROUTES.CREATE_TICKET}
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <FiPlus className="text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Ticket</p>
              <p className="text-sm text-gray-600">Submit a new support request</p>
            </div>
          </Link>

          <Link
            to={ROUTES.KNOWLEDGE_BASE}
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <FiBook className="text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Browse Knowledge Base</p>
              <p className="text-sm text-gray-600">Find answers to common questions</p>
            </div>
          </Link>

          <Link
            to={ROUTES.TICKETS}
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <FiTag className="text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View My Tickets</p>
              <p className="text-sm text-gray-600">Check status of your requests</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};