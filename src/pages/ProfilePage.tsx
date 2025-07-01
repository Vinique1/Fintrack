// src/pages/ProfilePage.tsx

import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from 'firebase/auth';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (!currentUser) {
      return setError("No user is logged in.");
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updatePassword(currentUser, newPassword);
      setSuccess("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError("Failed to update password. You may need to log out and log back in again before changing it.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">My Profile</h2>
        <p className="text-center text-gray-600 mb-6">Welcome, {currentUser?.email}</p>
        
        {error && <p className="mb-4 text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        {success && <p className="mb-4 text-center text-green-500 bg-green-100 p-3 rounded-md">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-medium border-b pb-2">Change Password</h3>
          <div>
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full"
              required minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full"
              required minLength={6}
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md">
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;