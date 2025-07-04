// src/App.tsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import AddTransaction from './components/AddTransaction';
import TransactionList, { type Transaction } from './components/TransactionList';
import Analytics from './components/Analytics';
import TransactionModal from './components/TransactionModal';
import { useAuth } from './context/AuthContext';
import { db } from './services/firebase';
import { collection, query, onSnapshot, orderBy, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function App() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');
  const pendingDeleteRef = useRef<{ transaction: Transaction, timeoutId: NodeJS.Timeout } | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Snapshot error: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (sortOrder) {
      case 'date-asc': filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break;
      case 'amount-desc': filtered.sort((a, b) => b.amount - a.amount); break;
      case 'amount-asc': filtered.sort((a, b) => a.amount - b.amount); break;
      default: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break;
    }
    return filtered;
  }, [transactions, currentMonth, currentYear, searchTerm, sortOrder]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
  }, [filteredTransactions]);

  const handleUpdate = async (transactionId: string, data: Omit<Transaction, 'id' | 'userId'>) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'transactions', transactionId);
      await updateDoc(docRef, data as any);
      setSelectedTransaction(null);
      toast.success("Transaction updated!");
    } catch (error) {
      console.error("Error updating transaction: ", error);
      toast.error("Failed to update transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const performActualDelete = async (transactionIdToDelete: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', transactionIdToDelete));
      toast.success("Transaction permanently deleted.");
    } catch (error) {
      console.error("Final delete failed: ", error);
      toast.error("Could not permanently delete transaction.");
    }
  };

  const handleDeleteRequest = (transactionToDelete: Transaction) => {
    if (pendingDeleteRef.current?.timeoutId) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
    }
    setSelectedTransaction(null);
    setTransactions(current => current.filter(t => t.id !== transactionToDelete.id));

    toast(
      (t) => (
        <div className="flex items-center gap-4">
          <span>Transaction deleted.</span>
          <button
            className="font-bold text-indigo-600 hover:text-indigo-800"
            onClick={() => {
              if (pendingDeleteRef.current?.timeoutId) {
                clearTimeout(pendingDeleteRef.current.timeoutId);
                pendingDeleteRef.current = null;
              }
              setTransactions(current => [transactionToDelete, ...current]);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );
    const timeoutId = setTimeout(() => {
      performActualDelete(transactionToDelete.id);
    }, 5000);
    pendingDeleteRef.current = { transaction: transactionToDelete, timeoutId };
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-center" />
      <div className="container mx-auto p-4 md:p-8">
        <Header
          currentMonth={currentMonth}
          currentYear={currentYear}
          onMonthChange={setCurrentMonth}
          onYearChange={setCurrentYear}
        />
        <main className="mt-8">
          <SummaryCards
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <AddTransaction />
              <TransactionList
                transactions={filteredTransactions}
                isLoading={isLoading}
                onSelectTransaction={setSelectedTransaction}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
            </div>
            <div className="space-y-6">
              <Analytics transactions={filteredTransactions} />
            </div>
          </div>
        </main>
      </div>
      <TransactionModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDelete={() => selectedTransaction && handleDeleteRequest(selectedTransaction)}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default App;