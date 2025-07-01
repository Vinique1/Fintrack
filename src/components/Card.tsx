// src/components/Card.tsx

import { type IconType } from 'react-icons';

interface CardProps {
  title: string;
  amount: number;
  icon: IconType;
  color: string;
}

const Card = ({ title, amount, icon: Icon, color }: CardProps) => {
  const amountColor = {
    green: 'text-green-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
  }[color];

  const bgColor = {
    green: 'bg-green-100',
    red: 'bg-red-100',
    indigo: 'bg-indigo-100',
  }[color];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${amountColor} mt-1`}>
            ₦{amount.toFixed(2)}
          </p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`${amountColor} text-xl`} />
        </div>
      </div>
    </div>
  );
};

export default Card;