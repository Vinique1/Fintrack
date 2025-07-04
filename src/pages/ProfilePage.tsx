// src/pages/ProfilePage.tsx

import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword, deleteUser } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { db } from '../services/firebase';
import { query, collection, where, getDocs, writeBatch } from 'firebase/firestore';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    setIsLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      toast.success("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error("Failed to update password. You may need to log out and log back in again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDelete = async () => {
    if (!currentUser) return;

    const isConfirmed = window.confirm(
      'Are you absolutely sure you want to delete your account? All of your transaction data will be permanently lost. This action cannot be undone.'
    );

    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      // Delete data first
      const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(transactionsQuery);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast.success("All transaction data deleted.");

      // Then delete the user
      await deleteUser(currentUser);
      toast.success("Account permanently deleted.");
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">My Profile</h2>
          <p className="text-center text-gray-600 mb-6">Welcome, {currentUser?.email}</p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <h3 className="text-lg font-medium border-b pb-2">Change Password</h3>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required minLength={6}
            />
          </div>
          {/* This button is now updated */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
          <p className="text-sm text-gray-500 mt-1">
            Deleting your account is a permanent action.
          </p>
          <button
            onClick={handleAccountDelete}
            disabled={isDeleting}
            className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400"
          >
            {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
          </button>
        </div>

        <p className="text-center">
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;