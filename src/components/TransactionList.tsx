// src/components/TransactionList.tsx

import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

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
}

const TransactionList = ({ transactions, isLoading, onSelectTransaction }: TransactionListProps) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-center text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions found for this period.</p>
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