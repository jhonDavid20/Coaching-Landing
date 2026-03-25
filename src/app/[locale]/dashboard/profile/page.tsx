'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/session-provider';
import { updateUserProfile } from '@/actions/auth';
import { toast } from 'sonner';
import { User, Mail, Shield, CheckCircle, XCircle, Pencil } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tDashboard = useTranslations('dashboard');
  const { user, loading, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
  });

  const startEditing = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
      });
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        toast.success(t('updateSuccess'));
        await refreshUser();
        setIsEditing(false);
      } else {
        toast.error(result.message || t('updateError'));
      }
    } catch {
      toast.error(t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">{tDashboard('loading')}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          {t('noUserData')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 bg-gradient-to-r from-blue-500 to-purple-600">
          <h1 className="text-4xl font-extrabold text-white text-center">
            {t('title')}
          </h1>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="ml-5">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 capitalize mt-1">
                  {user.role || t('member')}
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                {t('editProfile')}
              </button>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {t('accountDetails')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name - editable */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[72px]">
              <User className="w-5 h-5 text-orange-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('firstName')}
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.firstName || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Last Name - editable */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[72px]">
              <User className="w-5 h-5 text-orange-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('lastName')}
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.lastName || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Username - editable */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[72px]">
              <User className="w-5 h-5 text-green-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('username')}
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.username}
                  </p>
                )}
              </div>
            </div>

            {/* Email - read only */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[72px]">
              <Mail className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('email')}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Role - read only */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[72px]">
              <Shield className="w-5 h-5 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('role')}
                </p>
                <p className="text-gray-600 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            {/* Email Verification - read only */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[72px]">
              {user.isEmailVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('emailVerification')}
                </p>
                <p className={`text-sm ${user.isEmailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {user.isEmailVerified ? t('verified') : t('notVerified')}
                </p>
              </div>
            </div>
          </div>

          {/* Save / Cancel buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
