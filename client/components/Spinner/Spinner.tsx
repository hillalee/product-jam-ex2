import type { ComponentProps } from "react";
import { cx } from "../../lib/cx";
import styles from "./Spinner.module.css";

export type SpinnerProps = ComponentProps<"span"> & {
  size?: "sm" | "md" | "lg";

  label?: string;
};

export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cx(styles.wrapper, className)}
      {...props}
    >
      <span className={cx(styles.spinner, styles[size])} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
