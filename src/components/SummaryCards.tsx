// src/components/SummaryCards.tsx

import Card from './Card';
import { FaArrowUp, FaArrowDown, FaBalanceScale } from 'react-icons/fa';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const SummaryCards = ({ totalIncome, totalExpenses, balance }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Total Income" amount={totalIncome} icon={FaArrowUp} color="green" />
      <Card title="Total Expenses" amount={totalExpenses} icon={FaArrowDown} color="red" />
      <Card title="Balance" amount={balance} icon={FaBalanceScale} color="indigo" />
    </div>
  );
};

export default SummaryCards;