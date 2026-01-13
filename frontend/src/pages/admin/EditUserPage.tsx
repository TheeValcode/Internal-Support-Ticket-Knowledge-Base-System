import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiXCircle, FiLoader } from 'react-icons/fi';
import { userService, User, UserUpdate } from '../../services/users';

export const EditUserPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserUpdate>({
        name: '',
        email: '',
        role: 'user',
        is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const userData = await userService.getUserById(parseInt(id!));
            setUser(userData);
            setFormData({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                is_active: userData.is_active
            });
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            await userService.updateUser(user.id, formData);
            navigate(`/admin/users/${user.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
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
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                >
                    <FiArrowLeft className="h-5 w-5 mr-2" />
                    Back to User Details
                </button>
            </div>

            {/* Form */}
            <div className="card">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                    <p className="text-gray-600">Update user information and permissions</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <FiXCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="form-label">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="form-input"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="form-label">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="form-input"
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="role" className="form-label">
                                Role *
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="user">User</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.role === 'admin'
                                    ? 'Admins can manage users, tickets, and system settings'
                                    : 'Users can create and manage their own tickets'
                                }
                            </p>
                        </div>

                        <div>
                            <label className="form-label">
                                Account Status
                            </label>
                            <div className="mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Account is active
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Inactive users cannot log in to the system
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? (
                                <div className="flex items-center">
                                    <FiLoader className="animate-spin -ml-1 mr-3 h-4 w-4" />
                                    Updating User...
                                </div>
                            ) : (
                                'Update User'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};