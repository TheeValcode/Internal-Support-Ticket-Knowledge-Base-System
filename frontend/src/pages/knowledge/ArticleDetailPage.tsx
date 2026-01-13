import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiXCircle, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { articleService } from '../../services/articles';
import { KnowledgeArticle } from '../../types/article';
import { formatDate } from '../../utils/helpers';

export const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await articleService.getArticle(parseInt(id!));
      setArticle(response);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content: string): string => {
    // Simple markdown-like formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-gray-900 mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-6xl mb-4 flex justify-center">
          <FiXCircle />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error ? 'Error Loading Article' : 'Article Not Found'}
        </h3>
        <p className="text-gray-600 mb-6">
          {error || "The article you're looking for doesn't exist."}
        </p>
        <button onClick={() => navigate('/knowledge')} className="btn btn-primary">
          Back to Knowledge Base
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/knowledge')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="h-5 w-5 mr-2" />
          Back to Knowledge Base
        </button>

        {user?.role === 'admin' && (
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
              className="btn btn-secondary text-sm"
            >
              Edit Article
            </button>
          </div>
        )}
      </div>

      {/* Article */}
      <article className="card">
        {/* Article Header */}
        <header className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <span className="badge badge-blue">{article.category}</span>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {article.view_count} views
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          <div className="flex items-center text-sm text-gray-600">
            <span>Last updated {formatDate(article.updated_at)}</span>
            <span className="mx-2">•</span>
            <span>Created {formatDate(article.created_at)}</span>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose max-w-none">
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p class="mb-4">${formatContent(article.content)}</p>`
            }}
          />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Helpful Actions */}
      <div className="mt-8 text-center">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Was this article helpful?
          </h3>
          <p className="text-gray-600 mb-6">
            If you need additional assistance, please create a support ticket.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate('/tickets/new')}
              className="btn btn-primary"
            >
              Create Support Ticket
            </button>
            <button
              onClick={() => navigate('/knowledge')}
              className="btn btn-secondary"
            >
              Browse More Articles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};