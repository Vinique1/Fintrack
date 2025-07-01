// src/components/TransactionForm.tsx

import { useState, useEffect, type FormEvent } from 'react';
import { type Transaction } from './TransactionList';

const incomeCategories = [ 'Salary', 'Freelance', 'Investments', 'Gifts', 'Savings', 'Other Income' ];
const expenseCategories = [ 'Housing', 'Food', 'Transportation', 'Utilities', 'Church', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Personal Care', 'Debt Payments', 'Savings', 'Gifts', 'Other Expenses' ];

type TransactionData = Omit<Transaction, 'id' | 'userId'>;

interface TransactionFormProps {
  onSubmit: (data: TransactionData) => void;
  initialData?: TransactionData | null;
  buttonText: string;
  isSubmitting: boolean;
}

const TransactionForm = ({ onSubmit, initialData, buttonText, isSubmitting }: TransactionFormProps) => {
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'income');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(incomeCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(String(initialData.amount));
      setCategory(initialData.category);
      setDate(initialData.date);
    }
  }, [initialData]);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  // The change is on this line:
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? incomeCategories[0] : expenseCategories[0]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      alert('Please fill in the title and amount.');
      return;
    }
    onSubmit({
      type,
      title,
      amount: parseFloat(amount),
      category,
      date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`type-income-${initialData ? 'edit' : 'add'}`}
            name={`type-${initialData ? 'edit' : 'add'}`}
            value="income"
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            checked={type === 'income'}
            onChange={() => handleTypeChange('income')}
          />
          <label htmlFor={`type-income-${initialData ? 'edit' : 'add'}`} className="text-sm font-medium text-gray-700">Income</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`type-expense-${initialData ? 'edit' : 'add'}`}
            name={`type-${initialData ? 'edit' : 'add'}`}
            value="expense"
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
            checked={type === 'expense'}
            onChange={() => handleTypeChange('expense')}
          />
          <label htmlFor={`type-expense-${initialData ? 'edit' : 'add'}`} className="text-sm font-medium text-gray-700">Expense</label>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₦)</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isSubmitting}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isSubmitting}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:bg-indigo-400"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : buttonText}
      </button>
    </form>
  );
};

export default TransactionForm;