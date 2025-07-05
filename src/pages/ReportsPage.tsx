// src/pages/ReportsPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { type Transaction } from '../components/TransactionList';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import EmptyState from '../components/EmptyState';
import { FaChartPie, FaChartLine, FaArrowUp, FaArrowDown, FaBalanceScale, FaFileCsv } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));

  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!currentUser || !startDate || !endDate) return;

      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setReportData(data);
      } catch (error) {
        console.error("Error fetching report data: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportData();
  }, [currentUser, startDate, endDate]);

  const { pieChartData, categoryTotals } = useMemo(() => {
    const expenseData = reportData.filter(t => t.type === 'expense');
    const totals = expenseData.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      pieChartData: {
        labels: Object.keys(totals),
        datasets: [{
          label: 'Expenses by Category',
          data: Object.values(totals),
          backgroundColor: ['#4f46e5', '#f97316', '#ef4444', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#d946ef'],
          borderColor: '#ffffff',
          borderWidth: 2,
        }],
      },
      categoryTotals: totals,
    };
  }, [reportData]);

  const lineChartData = useMemo(() => {
    const dataByDate: { [key: string]: { income: number, expense: number } } = {};
    const rangeInDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24);
    const aggregateByMonth = rangeInDays > 45;

    reportData.forEach(t => {
      let key;
      const transactionDate = new Date(t.date);
      if (aggregateByMonth) {
        key = transactionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else {
        key = transactionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!dataByDate[key]) dataByDate[key] = { income: 0, expense: 0 };
      dataByDate[key][t.type] += t.amount;
    });
    
    const sortedLabels = Object.keys(dataByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return {
      labels: sortedLabels,
      datasets: [
        { label: 'Income', data: sortedLabels.map(label => dataByDate[label].income), borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.1 },
        { label: 'Expense', data: sortedLabels.map(label => dataByDate[label].expense), borderColor: '#ef4444', backgroundColor: '#ef4444', tension: 0.1 },
      ],
    };
  }, [reportData, startDate, endDate]);

  const summaryData = useMemo(() => {
    const income = reportData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = reportData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const topExpenses = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).slice(0, 3);
    return { income, expenses, net: income - expenses, topExpenses };
  }, [reportData, categoryTotals]);

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["ID", "Date", "Type", "Title", "Amount", "Category", "Description"];
    const csvRows = [
      headers.join(','),
      ...reportData.map(t => [
        t.id, t.date, t.type, `"${t.title.replace(/"/g, '""')}"`,
        t.amount, t.category, `"${t.description?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `fintrack-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">&larr; Back to Dashboard</Link>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">From</label>
              <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 border border-gray-300 rounded-md shadow-sm p-1"/>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">To</label>
              <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 border border-gray-300 rounded-md shadow-sm p-1"/>
            </div>
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-green-700">
            <FaFileCsv />
            Export to CSV
          </button>
        </div>

        {isLoading ? (
          <p className="text-center">Loading reports...</p>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Income vs. Expense Trend</h2>
              {reportData.length > 0 ? (
                <div className="h-80 w-full">
                  <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                </div>
              ) : (
                <EmptyState icon={FaChartLine} message="No transaction data for this period." />
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
                {pieChartData.labels.length > 0 ? (
                  <div className="h-80 w-full flex items-center justify-center">
                    <Pie data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' }}}} />
                  </div>
                ) : (
                  <EmptyState icon={FaChartPie} message="No expense data for this period." />
                )}
              </div>
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Cash Flow</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-green-600"><FaArrowUp /><span>Total Income</span></div><span className="font-bold">₦{summaryData.income.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-red-600"><FaArrowDown /><span>Total Expenses</span></div><span className="font-bold">₦{summaryData.expenses.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center border-t pt-3 mt-3"><div className="flex items-center gap-2 text-indigo-600"><FaBalanceScale /><span>Net Flow</span></div><span className="font-bold text-lg">₦{summaryData.net.toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Top Spending Categories</h2>
                  <div className="space-y-2">
                    {summaryData.topExpenses.length > 0 ? summaryData.topExpenses.map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span className="font-medium">₦{amount.toFixed(2)}</span>
                      </div>
                    )) : <p className="text-sm text-gray-500">No expense data.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;