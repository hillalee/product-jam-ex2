export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  NASA_API_KEY: string;
  GEMINI_API_KEY: string;
};

export type Variables = {
  user: { id: string; email: string };
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
