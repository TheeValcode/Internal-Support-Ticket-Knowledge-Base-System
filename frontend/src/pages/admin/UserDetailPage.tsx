import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FiUser,
    FiShield,
    FiCheckCircle,
    FiXCircle,
    FiArrowLeft
} from 'react-icons/fi';
import { userService, User } from '../../services/users';
import { formatDate } from '../../utils/helpers';

export const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resettingPassword, setResettingPassword] = useState(false);

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const userData = await userService.getUserById(parseInt(id!));
            setUser(userData);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!user) return;

        try {
            const updatedUser = user.is_active
                ? await userService.deactivateUser(user.id)
                : await userService.activateUser(user.id);
            setUser(updatedUser);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to update user status');
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPassword) return;

        setResettingPassword(true);
        try {
            await userService.resetUserPassword(user.id, newPassword);
            setNewPassword('');
            setShowPasswordReset(false);
            setError(null);
            // Show success message (you could add a success state)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to reset password');
        } finally {
            setResettingPassword(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!user) return;

        if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await userService.deleteUser(user.id);
            navigate('/admin/users');
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="text-center py-12">
                <div className="text-red-400 text-6xl mb-4 flex justify-center">
                    <FiXCircle />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading User</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate('/admin/users')} className="btn btn-primary">
                    Back to Users
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4 flex justify-center">
                    <FiUser />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
                <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
                <button onClick={() => navigate('/admin/users')} className="btn btn-primary">
                    Back to Users
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                >
                    <FiArrowLeft className="h-5 w-5 mr-2" />
                    Back to Users
                </button>

                <div className="flex items-center space-x-3">
                    <Link
                        to={`/admin/users/${user.id}/edit`}
                        className="btn btn-secondary"
                    >
                        Edit User
                    </Link>
                    <button
                        onClick={handleToggleStatus}
                        className={`btn ${user.is_active ? 'btn-secondary' : 'btn-primary'}`}
                    >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
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

            {/* User Details */}
            <div className="card">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">
                                {user.role === 'admin' ? <FiShield /> : <FiUser />}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                                <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>
                                    {user.role === 'admin' ? (
                                        <><FiShield className="inline mr-1" /> Admin</>
                                    ) : (
                                        <><FiUser className="inline mr-1" /> User</>
                                    )}
                                </span>
                                <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                                    {user.is_active ? (
                                        <><FiCheckCircle className="inline mr-1" /> Active</>
                                    ) : (
                                        <><FiXCircle className="inline mr-1" /> Inactive</>
                                    )}
                                </span>
                            </div>
                            <p className="text-gray-600">{user.email}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                <dd className="text-sm text-gray-900">#{user.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="text-sm text-gray-900">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="text-sm text-gray-900 capitalize">{user.role}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="text-sm text-gray-900">
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Timestamps</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="text-sm text-gray-900">{formatDate(user.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="text-sm text-gray-900">{formatDate(user.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Ticket Statistics */}
            {user.ticketStats && (
                <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{user.ticketStats.total_tickets}</div>
                            <div className="text-sm text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{user.ticketStats.open_tickets}</div>
                            <div className="text-sm text-gray-500">Open</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{user.ticketStats.in_progress_tickets}</div>
                            <div className="text-sm text-gray-500">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{user.ticketStats.resolved_tickets}</div>
                            <div className="text-sm text-gray-500">Resolved</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">{user.ticketStats.closed_tickets}</div>
                            <div className="text-sm text-gray-500">Closed</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="space-y-4">
                    {/* Password Reset */}
                    <div>
                        <button
                            onClick={() => setShowPasswordReset(!showPasswordReset)}
                            className="btn btn-secondary"
                        >
                            Reset Password
                        </button>

                        {showPasswordReset && (
                            <form onSubmit={handlePasswordReset} className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="mb-4">
                                    <label htmlFor="newPassword" className="form-label">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="form-input"
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="submit"
                                        disabled={resettingPassword || !newPassword}
                                        className="btn btn-primary"
                                    >
                                        {resettingPassword ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordReset(false);
                                            setNewPassword('');
                                        }}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Delete User */}
                    <div className="pt-4 border-t">
                        <button
                            onClick={handleDeleteUser}
                            className="btn btn-danger"
                        >
                            Delete User
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                            This action cannot be undone. The user will be permanently deleted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};