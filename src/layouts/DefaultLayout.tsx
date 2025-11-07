import { Link, Outlet } from "react-router";

export default function DefaultLayout() {
  return (
    <div>
      <header className="header">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/users">Users</Link>
          <Link to="/app/dashboard">Dashboard</Link>
          <Link to="/app/settings">Settings</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
