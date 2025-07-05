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
import { collection, query, onSnapshot, orderBy, where, doc, deleteDoc, updateDoc, addDoc, getDoc, getDocs } from 'firebase/firestore';

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
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [overallBudget, setOverallBudget] = useState(0);
  const [settings, setSettings] = useState<{ enableRollover?: boolean }>({});
  const [rolloverAmounts, setRolloverAmounts] = useState<Record<string, number>>({});

  // Corrected useEffect to fetch both transactions and settings
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setSettings({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Listener for transactions
    const transQuery = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsubscribeTransactions = onSnapshot(transQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
      setIsLoading(false);
    });

    // Listener for user settings
    const settingsDocRef = doc(db, 'userSettings', currentUser.uid);
    const unsubscribeSettings = onSnapshot(settingsDocRef, (doc) => {
      setSettings(doc.data() || {});
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeSettings();
    };
  }, [currentUser]);

  // useEffect to fetch budgets for the CURRENT month
  useEffect(() => {
    if (!currentUser) return;
    const budgetDocId = `budget-${currentUser.uid}-${currentYear}-${currentMonth}`;
    const docRef = doc(db, 'budgets', budgetDocId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBudgets(docSnap.data().amounts || {});
        setOverallBudget(docSnap.data().overallAmount || 0);
      } else {
        setBudgets({});
        setOverallBudget(0);
      }
    });
    return () => unsubscribe();
  }, [currentUser, currentMonth, currentYear]);

  // useEffect to calculate rollover from PREVIOUS month
  useEffect(() => {
    const calculateRollover = async () => {
      if (!currentUser || !settings.enableRollover) {
        setRolloverAmounts({});
        return;
      }
      const prevMonthDate = new Date(currentYear, currentMonth, 1);
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevMonth = prevMonthDate.getMonth();
      const prevYear = prevMonthDate.getFullYear();

      const budgetDocId = `budget-${currentUser.uid}-${prevYear}-${prevMonth}`;
      const budgetDoc = await getDoc(doc(db, 'budgets', budgetDocId));
      const prevBudgets = budgetDoc.data()?.amounts || {};

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        where('date', '>=', `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`),
        where('date', '<=', `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-31`)
      );
      const transactionSnap = await getDocs(q);
      const prevTransactions = transactionSnap.docs.map(d => d.data() as Transaction);
      
      const prevExpenses = prevTransactions.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, t: Transaction) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      const rollovers: Record<string, number> = {};
      for (const category in prevBudgets) {
        const budget = prevBudgets[category];
        const spent = prevExpenses[category] || 0;
        if (budget > spent) {
          rollovers[category] = budget - spent;
        }
      }
      setRolloverAmounts(rollovers);
    };
    calculateRollover();
  }, [currentUser, currentMonth, currentYear, settings.enableRollover]);

  const effectiveBudgets = useMemo(() => {
    const combined = { ...budgets };
    if (settings.enableRollover) {
      for (const category in rolloverAmounts) {
        combined[category] = (combined[category] || 0) + rolloverAmounts[category];
      }
    }
    return combined;
  }, [budgets, rolloverAmounts, settings.enableRollover]);

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

  const expensesByCategory = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [filteredTransactions]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
  }, [filteredTransactions]);

  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'userId'>) => {
    if (!currentUser) return;

    try {
      // We are deliberately not awaiting this so the UI feels instant.
      // The form will reset, and toasts will show up.
      addDoc(collection(db, 'transactions'), { ...data, userId: currentUser.uid });

      toast.success("Transaction added successfully!");

      // --- Budget Alert Logic ---
      if (data.type === 'expense') {
        const newTotalExpenses = totalExpenses + data.amount;
        // Check Overall Budget
        if (overallBudget > 0 && newTotalExpenses > overallBudget) {
          toast.error("You have exceeded your overall monthly budget!");
        } else if (overallBudget > 0 && (newTotalExpenses / overallBudget) >= 0.9) {
          // Use toast() with a custom icon instead of toast.warn()
          toast("Warning: You are over 90% of your overall budget.", { icon: '⚠️' });
        }

        // Check Category Budget
        const categoryBudget = budgets[data.category];
        // Note: expensesByCategory is from a useMemo, it won't update until the next render.
        // For instant feedback, we calculate the new total here.
        const newTotalForCategory = (expensesByCategory[data.category] || 0) + data.amount;
        if (categoryBudget > 0 && newTotalForCategory > categoryBudget) {
          toast.error(`You have exceeded your budget for ${data.category}!`);
        } else if (categoryBudget > 0 && (newTotalForCategory / categoryBudget) >= 0.9) {
          // Use toast() with a custom icon instead of toast.warn()
          toast(`Warning: You've spent over 90% of your ${data.category} budget.`, { icon: '⚠️' });
        }
      }
    } catch (error) {
      toast.error("Failed to add transaction.");
      console.error("Error adding document: ", error);
      throw error;
    }
  };

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
            overallBudget={overallBudget} // Pass the prop down
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <AddTransaction onAdd={handleAddTransaction} />
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
              {/* Pass the new budgets prop to Analytics */}
              <Analytics transactions={filteredTransactions} budgets={effectiveBudgets} />
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