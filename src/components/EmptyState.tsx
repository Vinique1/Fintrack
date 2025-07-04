// src/components/EmptyState.tsx

import { type IconType } from 'react-icons';

interface EmptyStateProps {
  icon: IconType;
  message: string;
}

const EmptyState = ({ icon: Icon, message }: EmptyStateProps) => {
  return (
    <div className="text-center py-10">
      <Icon className="mx-auto text-5xl text-gray-300" />
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
};

export default EmptyState;