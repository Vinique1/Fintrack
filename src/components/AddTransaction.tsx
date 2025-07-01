// src/components/AddTransaction.tsx

import { useState } from 'react';
import TransactionForm from './TransactionForm';
import { db, auth } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

const AddTransaction = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTransaction = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        ...data,
        userId: user.uid, // Add the user ID
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add transaction.");
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