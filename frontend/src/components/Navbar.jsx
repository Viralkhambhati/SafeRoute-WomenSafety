import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <nav className="saferoute-navbar">
      {/* Brand */}
      <Link to="/" className="saferoute-brand">
        <div className="saferoute-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span className="saferoute-brand-name">SafeRoute</span>
      </Link>

      {/* Contextual Nav Links */}
      <div className="saferoute-nav-links">

        {/* Home page → Add Rating + About only */}
        {path === "/" && (
          <>
            <Link to="/about" className="saferoute-nav-link" style={{ marginRight: '16px' }}>
              About
            </Link>
            <button className="saferoute-signin-btn" onClick={() => navigate("/add-rating")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Add Rating
            </button>
          </>
        )}

        {/* Signin page → Home + Signup */}
        {path === "/signin" && (
          <>
            <Link to="/" className="saferoute-nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </Link>
            <button className="saferoute-signin-btn" onClick={() => navigate("/signup")}>
              Sign Up
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Signup page → Home + Sign In */}
        {path === "/signup" && (
          <>
            <Link to="/" className="saferoute-nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </Link>
            <button className="saferoute-signin-btn" onClick={() => navigate("/signin")}>
              Sign In
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dashboard / Analytics / Add Rating page → Home + Sign Out */}
        {(path === "/dashboard" || path === "/add-rating") && (
          <>
            <Link to="/dashboard" className="saferoute-nav-link" style={{ marginRight: '16px' }}>
              Dashboard
            </Link>
            <Link to="/" className="saferoute-nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </Link>
            <div className="saferoute-user-dot" title="Logged in" />
            <button className="saferoute-signout-btn" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign Out
            </button>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;