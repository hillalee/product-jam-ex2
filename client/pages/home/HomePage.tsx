import { Link } from "react-router";

export default function HomePage() {
  return (
    <main>
      <h1>Exercise 2</h1>
      <p>My web app for Product Jam.</p>
      <ul>
        <li>
          <Link to="/tic-tac-toe">Tic-tac-toe</Link>
        </li>
        <li>
          <Link to="/nasa">Space pictures</Link>
        </li>
        <li>
          <Link to="/design">Design</Link>
        </li>
      </ul>
    </main>
  );
}
