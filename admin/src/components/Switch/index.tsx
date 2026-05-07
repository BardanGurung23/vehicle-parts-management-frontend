import React, { useEffect, useState } from "react";

interface ToggleSwitchProps {
  isActive: boolean;
  onToggle: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isActive, onToggle }) => {
  const [checked, setChecked] = useState(isActive);

  useEffect(() => {
    setChecked(isActive);
  }, [isActive]);

  const handleToggle = () => {
    const newValue = !checked;
    setChecked(newValue);
    onToggle(newValue);
  };

  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={handleToggle}
        />
        <div
          className={`block w-10 h-6 rounded-full transition-colors duration-200 ${
            checked ? "bg-primary" : "bg-surface-container-highest"
          }`}
        ></div>
        <div
          className={`absolute left-1 top-1 w-4 h-4 bg-on-primary rounded-full transition-transform duration-200 ${
            checked ? "translate-x-4" : ""
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
