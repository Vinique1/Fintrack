// src/components/SummaryCards.tsx

import Card from './Card';
import { FaArrowUp, FaArrowDown, FaBalanceScale } from 'react-icons/fa';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  overallBudget: number; // Add prop
}

const SummaryCards = ({ totalIncome, totalExpenses, balance, overallBudget }: SummaryCardsProps) => {
  const expensePercentage = overallBudget > 0 ? (totalExpenses / overallBudget) * 100 : 0;
  
  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Total Income" amount={totalIncome} icon={FaArrowUp} color="green" />
      
      {/* Custom layout for Total Expenses card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              ₦{totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <FaArrowDown className="text-red-600 text-xl" />
          </div>
        </div>
        {overallBudget > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 text-right">
              of ₦{overallBudget.toFixed(2)} budget
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(expensePercentage)}`}
                style={{ width: `${Math.min(expensePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <Card title="Balance" amount={balance} icon={FaBalanceScale} color="indigo" />
    </div>
  );
};

export default SummaryCards;