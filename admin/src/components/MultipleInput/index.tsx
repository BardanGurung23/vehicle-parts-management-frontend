import React, { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";

interface MultiInputProps {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  className?: string;
  error?: string | null;
}

const MultiInput: React.FC<MultiInputProps> = ({
  name,
  label,
  control,
  placeholder = "Add item",
  className,
  error,
}) => {
  const [inputValue, setInputValue] = useState("");
  const value = useWatch({ control, name });
  const [tags, setTags] = useState<string[]>(value || []);

  useEffect(() => {
    setTags(value || []);
  }, [value]);

  const handleAddTag = () => {
    if (inputValue && !tags.includes(inputValue)) {
      const newTags = [...tags, inputValue];
      setTags(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  return (
    <div className={className}>
      <label className="input-label">{label}</label>
      <Controller
        name={name}
        control={control}
        defaultValue={tags}
        render={({ field: { onChange, onBlur } }) => (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-primary-container text-on-primary-container rounded px-2 py-1 flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveTag(index);
                      onChange(tags.filter((_, i) => i !== index));
                    }}
                    className="ml-2 text-error hover:opacity-80 transition-opacity"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              placeholder={placeholder}
              className="border border-outline-variant rounded p-2 bg-surface-container-low text-on-surface focus:border-primary focus:outline-none transition-colors"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                  onChange([...tags, inputValue]);
                }
              }}
              onBlur={() => onChange(tags)}
            />
            {error && (
              <span className="text-[0.75rem] text-error">{error}</span>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default MultiInput;
