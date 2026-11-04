import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { Spinner } from "../components";
import { useAuth } from "../lib/auth";
import {
  APP_NAME,
  COURSE_CREDITS,
  GITHUB_URL,
  SHOW_DEMOS,
} from "../lib/config";
import styles from "./Layout.module.css";

export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.appName}>
          {APP_NAME}
        </Link>
        <nav className={styles.nav}>
          <Link to="/">Home</Link>
          <Link to="/tic-tac-toe">Tic-tac-toe</Link>
          <Link to="/nasa">Space pictures</Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {SHOW_DEMOS ? <Link to="/demos">Demos</Link> : null}
        </nav>
      </header>

      <div className={styles.content}>
        <Suspense
          fallback={
            <main>
              <Spinner />
            </main>
          }
        >
          <Outlet />
        </Suspense>
      </div>

      <footer className={styles.footer}>
        <p>
          <AuthAction /> | {COURSE_CREDITS}
        </p>
      </footer>
    </div>
  );
}

function AuthAction() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Link to="/signin">Log In</Link>;

  return (
    <>
      {user.email} :){" "}
      <button
        type="button"
        className={styles.linkButton}
        onClick={() => void signOut()}
      >
        Log Out
      </button>
    </>
  );
}
