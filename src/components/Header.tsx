// src/components/Header.tsx

import { FaWallet, FaChevronDown, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // <-- Add this line
import { signOut } from 'firebase/auth'; // <-- Add this line
import { auth } from '../services/firebase'; // <-- Add this line
import { Link } from 'react-router-dom'; // Import Link


interface HeaderProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const Header = ({ currentMonth, currentYear, onMonthChange, onYearChange }: HeaderProps) => {
  const { currentUser } = useAuth(); // Get the current user from our context

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle the redirect
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <header>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <FaWallet className="text-3xl text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">FinTrack</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Month and Year selectors */}
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={currentYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
                    
          {currentUser && (
            <>
              <Link to="/profile" title="My Profile" className="text-gray-600 hover:text-indigo-600">
                <FaUserCircle className="text-2xl" />
              </Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </>
          )}
        </div>
      </div>
      <p className="text-gray-600 mt-2">Track your monthly income and expenses effortlessly</p>
    </header>
  );
};

export default Header;