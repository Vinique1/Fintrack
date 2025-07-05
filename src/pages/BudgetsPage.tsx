// src/pages/BudgetsPage.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const expenseCategories = [ 'Housing', 'Food', 'Transportation', 'Utilities', 'Church', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Personal Care', 'Debt Payments', 'Savings', 'Gifts', 'Other Expenses' ];

const BudgetsPage = () => {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [overallBudget, setOverallBudget] = useState(0);
  const [enableRollover, setEnableRollover] = useState(false); // Add state for the setting
  const [isLoading, setIsLoading] = useState(true);

  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const budgetDocId = `budget-${currentUser?.uid}-${year}-${month}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const budgetDocRef = doc(db, 'budgets', budgetDocId);
        const settingsDocRef = doc(db, 'userSettings', currentUser.uid);

        const [budgetSnap, settingsSnap] = await Promise.all([getDoc(budgetDocRef), getDoc(settingsDocRef)]);

        if (budgetSnap.exists()) {
          setBudgets(budgetSnap.data().amounts || {});
          setOverallBudget(budgetSnap.data().overallAmount || 0);
        }
        if (settingsSnap.exists()) {
          setEnableRollover(settingsSnap.data().enableRollover || false);
        }
      } catch (error) {
        toast.error("Could not load data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, budgetDocId]);

  const handleBudgetChange = (category: string, amount: string) => {
    setBudgets(prev => ({
      ...prev,
      [category]: Number(amount) || 0,
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const budgetDocRef = doc(db, 'budgets', budgetDocId);
      const settingsDocRef = doc(db, 'userSettings', currentUser.uid);

      await Promise.all([
        setDoc(budgetDocRef, { amounts: budgets, overallAmount: overallBudget, userId: currentUser.uid }),
        setDoc(settingsDocRef, { enableRollover: enableRollover, userId: currentUser.uid }, { merge: true })
      ]);
      
      toast.success("Settings and budgets saved!");
    } catch (error) {
      toast.error("Failed to save.");
    } finally {
      setIsLoading(false);
    }
  };

  // When the page first loads, we want to show a loading indicator
  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p>Loading budgets...</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Monthly Budgets</h1>
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Dashboard
          </Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          {/* Add Rollover Toggle */}
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div>
              <h3 className="text-lg font-medium">Enable Rollover Budgets</h3>
              <p className="text-sm text-gray-500">Carry over unused budget amounts to the next month.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enableRollover} onChange={(e) => setEnableRollover(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium">Overall Monthly Budget</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold">₦</span>
              <input
                type="number"
                value={overallBudget || ''}
                onChange={(e) => setOverallBudget(Number(e.target.value) || 0)}
                placeholder="e.g., 150000"
                className="border border-gray-300 rounded-md p-1 w-40"
              />
            </div>
          </div>
          <h3 className="text-lg font-medium">Category Budgets</h3>
          <p className="text-gray-600 mb-4 text-sm">Set your spending limits for each category.</p>
          <div className="space-y-4">
            {expenseCategories.map(category => (
              <div key={category} className="flex justify-between items-center">
                <label htmlFor={`budget-${category}`} className="font-medium">{category}</label>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">₦</span>
                  <input
                    type="number"
                    id={`budget-${category}`}
                    value={budgets[category] || ''}
                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                    placeholder="0.00"
                    className="border border-gray-300 rounded-md p-1 w-32 text-right"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t pt-4 text-right">
            <button onClick={handleSave} disabled={isLoading} className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
              {isLoading ? 'Saving...' : 'Save Budgets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;