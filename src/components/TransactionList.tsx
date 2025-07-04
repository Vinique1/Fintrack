// src/components/TransactionList.tsx

import { FaArrowUp, FaArrowDown, FaFileInvoiceDollar } from 'react-icons/fa'; // Add FaFileInvoiceDollar
import EmptyState from './EmptyState'; // Import the new component

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onSelectTransaction: (transaction: Transaction) => void; // <-- Add this prop
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}

const TransactionList = ({ transactions, isLoading, onSelectTransaction, searchTerm, setSearchTerm, sortOrder, setSortOrder }: TransactionListProps) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-center text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md py-1 px-2 text-sm w-full"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-md py-1 px-2 text-sm"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High-Low)</option>
            <option value="amount-asc">Amount (Low-High)</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <EmptyState 
            icon={FaFileInvoiceDollar} 
            message="No transactions found for this period." 
          />
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="py-4 px-2 hover:bg-gray-50" onClick={() => onSelectTransaction(transaction)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {transaction.type === 'income' ? <FaArrowUp className="text-green-600" /> : <FaArrowDown className="text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.title}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;