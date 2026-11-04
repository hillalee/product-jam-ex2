import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import { Spinner } from "../Spinner";
import styles from "./Button.module.css";

export type ButtonProps = PlainClassName<ComponentProps<typeof BaseButton>> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cx(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </BaseButton>
  );
}
