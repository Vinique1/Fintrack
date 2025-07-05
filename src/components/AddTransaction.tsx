// src/components/AddTransaction.tsx

import { useState } from 'react';
import TransactionForm from './TransactionForm';
import { type Transaction } from './TransactionList';

type TransactionData = Omit<Transaction, 'id' | 'userId'>;

interface AddTransactionProps {
  onAdd: (data: TransactionData) => Promise<void>;
}

const AddTransaction = ({ onAdd }: AddTransactionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTransaction = async (data: TransactionData) => {
    setIsSubmitting(true);
    try {
      await onAdd(data);
    } catch (error) {
      // The parent component will show the toast, but we can still log here
      console.error("Failed to add transaction from child", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Transaction</h2>
      <TransactionForm 
        onSubmit={handleAddTransaction}
        buttonText="Add Transaction"
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddTransaction;