import { Link } from "react-router";
import { useAuth } from "../../lib/auth";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <main className={styles.page}>
      <h1>Exercise 2</h1>
      <p>Play tic-tac-toe or explore pictures from NASA.</p>
      <ul className={styles.links}>
        <li>
          <Link to="/tic-tac-toe">Tic-tac-toe</Link>
        </li>
        <li>
          <Link to="/nasa">Pictures from space</Link>
        </li>
        <li>
          <Link to="/design">Design</Link> — part 3 is not ready yet.
        </li>
      </ul>
      {!user ? (
        <p>
          <Link to="/signin">Log in</Link> to play and view pictures.
        </p>
      ) : null}
    </main>
  );
}
