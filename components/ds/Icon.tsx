import type { CSSProperties, HTMLAttributes } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Icon size tokens (px). Matches the semantic type scale.
 *   xs → 14 (inline meta: timestamps, counts)
 *   sm → 16 (dense buttons, list items, tags)
 *   md → 18 (default — standard button/menu icons)
 *   lg → 20 (prominent buttons, card headers)
 *   xl → 24 (page headers, empty states)
 */
export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
} as const;

export type IconSize = keyof typeof ICON_SIZES | number;

/**
 * Material Symbols axis values. Weight controls stroke thickness,
 * fill toggles solid vs outlined.
 */
export const ICON_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  bold: 600,
} as const;

export type IconWeight = keyof typeof ICON_WEIGHTS | number;

interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  size?: IconSize;
  weight?: IconWeight;
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Icon — Google Material Symbols (Outlined) wrapper with consistent
 * sizing & weight tokens.
 *
 * Requires Material Symbols Outlined to be loaded in the host app, e.g.:
 *   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />
 */
export function Icon({
  name,
  size = "md",
  weight = "normal",
  filled = false,
  className,
  style,
  ...rest
}: IconProps) {
  const px = typeof size === "number" ? size : ICON_SIZES[size];
  const wght = typeof weight === "number" ? weight : ICON_WEIGHTS[weight];

  return (
    <span
      aria-hidden="true"
      {...rest}
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        fontSize: px,
        lineHeight: 1,
        width: px,
        height: px,
        fontVariationSettings: `'opsz' ${px}, 'wght' ${wght}, 'FILL' ${filled ? 1 : 0}`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
