export const DIRECTION: "rtl" | "ltr" = "ltr";

export const LANG = "en";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const SUPABASE_ENABLED = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);

export const SHOW_DEMOS =
  import.meta.env.DEV && import.meta.env.VITE_SHOW_DEMOS !== "false";

export const APP_NAME = "Exercise 2";

export const GITHUB_URL = "https://github.com/hillalee/product-jam-ex2";
export const COURSE_CREDITS = "Product Jam 2027";
