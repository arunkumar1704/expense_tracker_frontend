import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './mylayout.css';

function MyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const isAuth =
    location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-icon">💰</span>
          <span className="nav-title">Expense Tracker</span>
        </div>
        <div className="nav-links">
          {token && !isAuth ? (
            <>
              <Link
                to="/"
                className={location.pathname === '/' ? 'active' : ''}
              >
                Dashboard
              </Link>
              <Link
                to="/expenses"
                className={location.pathname === '/expenses' ? 'active' : ''}
              >
                Expenses
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : !token ? (
            <>
              <Link
                to="/login"
                className={location.pathname === '/login' ? 'active' : ''}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={location.pathname === '/register' ? 'active' : ''}
              >
                Register
              </Link>
            </>
          ) : null}
        </div>
      </nav>

      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MyLayout;
