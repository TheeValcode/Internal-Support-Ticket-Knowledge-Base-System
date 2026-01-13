import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { KnowledgeBasePage } from './pages/knowledge/KnowledgeBasePage';
import { ArticleDetailPage } from './pages/knowledge/ArticleDetailPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import './styles/globals.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected routes */}
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="tickets" element={<TicketsPage />} />
                        <Route path="tickets/:id" element={<TicketDetailPage />} />
                        <Route path="tickets/new" element={<CreateTicketPage />} />
                        <Route path="knowledge" element={<KnowledgeBasePage />} />
                        <Route path="knowledge/:id" element={<ArticleDetailPage />} />

                        {/* Admin routes */}
                        <Route path="admin/*" element={<AdminDashboard />} />
                    </Route>

                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;