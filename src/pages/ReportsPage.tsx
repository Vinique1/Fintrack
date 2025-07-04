// src/pages/ReportsPage.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { type Transaction } from '../components/TransactionList';
import { Link } from 'react-router-dom';

const ReportsPage = () => {
  const { currentUser } = useAuth();
  // Set default dates for the last 30 days
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));

  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setReportData(data);

      } catch (error) {
        console.error("Error fetching report data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [currentUser, startDate, endDate]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Dashboard
          </Link>
        </div>
        
        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 mb-8">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">From</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1"/>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">To</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1"/>
          </div>
        </div>

        {/* Reports Content Area */}
        {isLoading ? (
          <p>Loading report...</p>
        ) : (
          <div className="space-y-8">
            {/* We will add report widgets here */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold">Report Summary</h2>
              <p className="mt-2 text-gray-600">
                Found <strong>{reportData.length}</strong> transactions for the selected period.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;