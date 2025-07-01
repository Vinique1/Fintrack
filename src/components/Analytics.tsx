// src/components/Analytics.tsx

import { useMemo } from 'react';
import { type Transaction } from './TransactionList';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics = ({ transactions }: AnalyticsProps) => {
  // Memoize expense category calculations
  const expenseCategoriesData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    if (expenseTransactions.length === 0) return { categories: [], total: 0 };

    const categoryMap = expenseTransactions.reduce((map, t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
      return map;
    }, {} as Record<string, number>);

    const categories = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
    
    const total = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    return { categories, total };
  }, [transactions]);

  // Memoize chart data calculations
  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return { labels: [], datasets: [] };
    }
    const firstTransactionDate = new Date(transactions[0].date);
    const year = firstTransactionDate.getFullYear();
    const month = firstTransactionDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

    const incomeByDay = Array(daysInMonth).fill(0);
    const expensesByDay = Array(daysInMonth).fill(0);

    transactions.forEach(t => {
      const day = new Date(t.date).getDate() - 1;
      if (t.type === 'income') {
        incomeByDay[day] += t.amount;
      } else {
        expensesByDay[day] += t.amount;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeByDay,
          backgroundColor: '#10b981',
          borderRadius: 4,
        },
        {
          label: 'Expenses',
          data: expensesByDay.map(amount => -amount), // Negative to go downwards
          backgroundColor: '#ef4444',
          borderRadius: 4,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: {
        stacked: true,
        ticks: {
          callback: (value: string | number) => `₦${Math.abs(Number(value))}`,
        },
      },
    },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = `₦${Math.abs(context.raw).toFixed(2)}`;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Breakdown</h2>
        <div className="h-[300px]">
          <Bar options={chartOptions} data={chartData} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Expense Categories</h2>
        <div className="space-y-3">
          {expenseCategoriesData.categories.length > 0 ? (
            expenseCategoriesData.categories.map(cat => {
              const percentage = (cat.amount / expenseCategoriesData.total) * 100;
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-gray-500">
                      ₦{cat.amount.toFixed(2)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-4">No expense data available</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Analytics;