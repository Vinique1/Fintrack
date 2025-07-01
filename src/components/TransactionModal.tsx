// src/components/TransactionModal.tsx

import { useState, useEffect } from 'react';
import { type Transaction } from './TransactionList';
import TransactionForm from './TransactionForm';

type TransactionData = Omit<Transaction, 'id' | 'userId'>;

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDelete: (transactionId: string) => void;
  onUpdate: (transactionId: string, data: TransactionData) => void;
  isSubmitting: boolean;
}

const TransactionModal = ({ transaction, onClose, onDelete, onUpdate, isSubmitting }: TransactionModalProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // When the modal is closed or the transaction changes, reset the editing state
  useEffect(() => {
    if (transaction) {
      setIsEditing(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleUpdate = (data: TransactionData) => {
    onUpdate(transaction.id, data);
  };

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-6">
        {isEditing ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Transaction</h3>
            <TransactionForm 
              onSubmit={handleUpdate}
              initialData={transaction}
              buttonText="Save Changes"
              isSubmitting={isSubmitting}
            />
            <button onClick={() => setIsEditing(false)} className="mt-2 w-full text-center text-sm text-gray-600 hover:text-gray-800 py-2">
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{transaction.title}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <p className="font-medium">Amount:</p>
                <p className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Type:</p>
                <p className="capitalize">{transaction.type}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Category:</p>
                <p>{transaction.category}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Date:</p>
                <p>{formattedDate}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white border border-transparent rounded-md hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(transaction.id)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white border border-transparent rounded-md hover:bg-red-700 disabled:bg-red-400"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;