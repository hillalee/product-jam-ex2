import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth";

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();

  if (loading) return <main>Logging in...</main>;

  return <Navigate to={user ? "/" : "/signin"} replace />;
}
