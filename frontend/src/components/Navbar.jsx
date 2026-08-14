import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/signin");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="saferoute-navbar">
      {/* Brand */}
      <Link to="/" className="saferoute-brand" onClick={closeMobile}>
        <div className="saferoute-brand-icon" aria-hidden="true">
          <img src="/app-icon.svg" alt="" />
        </div>
        <span className="saferoute-brand-name">SafeRoute</span>
      </Link>

      {/* Desktop Nav Links */}
      <div className="saferoute-nav-links">
        {path === "/" && (
          <>
            <Link to="/dashboard" className="saferoute-nav-link">Dashboard</Link>
            <Link to="/about" className="saferoute-nav-link">About</Link>
          </>
        )}
        {path === "/signin" && (
          <Link to="/" className="saferoute-nav-link">Home</Link>
        )}
        {path === "/signup" && (
          <Link to="/" className="saferoute-nav-link">Home</Link>
        )}
        {path === "/dashboard" && (
          <>
            <Link to="/" className="saferoute-nav-link">Home</Link>
            <Link to="/about" className="saferoute-nav-link">About</Link>
          </>
        )}
        {path === "/add-rating" && (
          <>
            <Link to="/" className="saferoute-nav-link">Home</Link>
            <Link to="/dashboard" className="saferoute-nav-link">Dashboard</Link>
            <Link to="/about" className="saferoute-nav-link">About</Link>
          </>
        )}
        {path === "/about" && (
          <>
            <Link to="/" className="saferoute-nav-link">Home</Link>
            <Link to="/dashboard" className="saferoute-nav-link">Dashboard</Link>
          </>
        )}
      </div>

      {/* Desktop Actions */}
      <div className="saferoute-nav-actions">
        {path === "/" && (
          <button className="saferoute-action-btn saferoute-action-primary" onClick={() => navigate("/add-rating")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Add Rating
          </button>
        )}
        {path === "/signin" && (
          <button className="saferoute-action-btn saferoute-action-primary" onClick={() => navigate("/signup")}>
            Sign Up
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {path === "/signup" && (
          <button className="saferoute-action-btn saferoute-action-primary" onClick={() => navigate("/signin")}>
            Sign In
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {(path === "/dashboard" || path === "/add-rating") && (
          <>
            <div className="saferoute-user-dot" title="Logged in" />
            <button className="saferoute-action-btn saferoute-action-ghost" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign Out
            </button>
          </>
        )}
        {path === "/about" && (
          <button className="saferoute-action-btn saferoute-action-primary" onClick={() => navigate("/add-rating")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Add Rating
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="saferoute-mobile-menu-btn"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        <span className={`saferoute-hamburger ${mobileOpen ? "open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Mobile Right Side Menu */}
      <div className={`saferoute-mobile-menu ${mobileOpen ? "open" : ""}`}>
        <div className="saferoute-mobile-menu-header">
          <Link to="/" className="saferoute-brand" onClick={closeMobile}>
            <div className="saferoute-brand-icon" aria-hidden="true">
              <img src="/app-icon.svg" alt="" />
            </div>
            <span className="saferoute-brand-name">SafeRoute</span>
          </Link>
          <button className="saferoute-mobile-close-btn" onClick={closeMobile} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="saferoute-mobile-links">
          <Link to="/" className="saferoute-mobile-link" onClick={closeMobile}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>
          <Link to="/about" className="saferoute-mobile-link" onClick={closeMobile}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About
          </Link>
          <Link to="/dashboard" className="saferoute-mobile-link" onClick={closeMobile}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link to="/add-rating" className="saferoute-mobile-link" onClick={closeMobile}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Add Rating
          </Link>

          {!token ? (
            <>
              <Link to="/signin" className="saferoute-mobile-link" onClick={closeMobile}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </Link>
              <Link to="/signup" className="saferoute-mobile-link" onClick={closeMobile}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Sign Up
              </Link>
            </>
          ) : (
            <button className="saferoute-mobile-link saferoute-mobile-signout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen && <div className="saferoute-mobile-overlay" onClick={closeMobile} />}
    </nav>
  );
}

export default Navbar;
