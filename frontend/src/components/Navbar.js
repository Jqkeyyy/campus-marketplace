import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Campus Marketplace
        </Link>
        <div className="navbar-links">
          <Link to="/" className="navbar-link">Browse</Link>
          {isAuthenticated ? (
            <>
              <Link to="/create-listing" className="navbar-link">Sell</Link>
              <Link to="/my-listings" className="navbar-link">My Listings</Link>
              <Link to="/favorites" className="navbar-link">Favorites</Link>
              <Link to="/messages" className="navbar-link">Messages</Link>
              <Link to="/profile" className="navbar-link">{user?.display_name}</Link>
              <button onClick={logout} className="btn btn-small btn-outline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-small btn-primary">Login</Link>
              <Link to="/register" className="btn btn-small btn-outline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
