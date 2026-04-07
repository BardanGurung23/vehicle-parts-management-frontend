import React, { useEffect } from "react";
import { RxCross2 } from "react-icons/rx";

interface DrawerType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  width?: string;
  position?: "left" | "right";
  className?: string;
}

export default function Drawer({
  isOpen,
  setIsOpen,
  children,
  width = "50%",
  position = "right",
  className,
}: Readonly<DrawerType>) {
  // Close drawer on pressing 'Esc' key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false); // Close the drawer
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]); // Re-run effect when `isOpen` changes

  const toggleDrawer = () => {
    setIsOpen(false);
  };

  return (
    <div
      className={`fixed top-0 ${
        position === "right" ? "right-0" : "left-0"
      } h-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen
          ? "transform translate-x-0"
          : position === "right"
            ? "transform translate-x-full"
            : "transform -translate-x-full"
      } ${width} ${className}`}
    >
      {/* Close button inside the drawer */}
      <button
        onClick={toggleDrawer}
        className="absolute top-4 right-4 text-xl text-gray-500"
      >
        <RxCross2 size={22} />
      </button>

      {/* Drawer content */}
      <div className="p-4 h-full overflow-y-auto">{children}</div>
    </div>
  );
}
