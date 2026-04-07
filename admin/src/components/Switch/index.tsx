import React, { useState } from "react";

interface ToggleSwitchProps {
  isActive: boolean;
  onToggle: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isActive, onToggle }) => {
  const [checked, setChecked] = useState(isActive);

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
          className={`block w-10 h-6 rounded-full transition ${
            checked ? "bg-primaryColor" : "bg-gray-400"
          }`}
        ></div>
        <div
          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition ${
            checked ? "transform translate-x-4" : ""
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
