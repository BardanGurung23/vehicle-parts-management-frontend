import { Loader2 } from "lucide-react";
import { FC } from "react";
import styles from "./index.module.css";

// Define props interface
interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  withText?: boolean;
}

const Spinner: FC<SpinnerProps> = ({
  size = 24,
  color = "#3B82F6",
  className = "",
  withText = false,
}) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center font-roboto text-base ${
        withText ? "gap-2" : ""
      } ${className}`}
      style={{ color }}
    >
      <Loader2
        className={styles.spinner}
        style={{ width: size, height: size }}
        color={color}
      />
      {withText && <span>Loading...</span>}
    </div>
  );
};

export default Spinner;
