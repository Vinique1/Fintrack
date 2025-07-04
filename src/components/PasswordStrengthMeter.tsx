// src/components/PasswordStrengthMeter.tsx

interface PasswordStrengthMeterProps {
  strength: number; // A score from 0 (worst) to 4 (best)
}

const PasswordStrengthMeter = ({ strength }: PasswordStrengthMeterProps) => {
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const color = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"][strength];

  return (
    <div>
      <div className="flex gap-2 mt-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-2 flex-1 rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-300 ${index <= strength ? color : 'bg-gray-200'}`}
            ></div>
          </div>
        ))}
      </div>
      <p className="text-right text-sm mt-1 font-medium" style={{ color: color?.replace('bg-', 'text-') }}>
        {strengthLabels[strength]}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;