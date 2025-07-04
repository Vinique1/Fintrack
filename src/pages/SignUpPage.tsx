// src/pages/SignUpPage.tsx

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'; // Corrected import
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

// Optional: You can add common words to zxcvbn to improve its evaluation
zxcvbnOptions.setOptions({
  dictionary: {
    ...zxcvbnOptions.dictionary,
    userInputs: ['fintrack', 'finance', 'tracker'],
  },
});

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password);
      setStrength(result.score);
      // Show the first warning or suggestion, if available
      setFeedback(result.feedback.warning || result.feedback.suggestions[0] || '');
    } else {
      setStrength(0);
      setFeedback('');
    }
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (strength < 2) {
      toast.error("Please choose a stronger password.");
      return;
    }
    
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully!");
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email address is already in use.');
      } else {
        toast.error('Failed to create an account. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Your FinTrack Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <PasswordStrengthMeter strength={strength} />
            {feedback && <p className="text-xs text-gray-500 mt-1">{feedback}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;