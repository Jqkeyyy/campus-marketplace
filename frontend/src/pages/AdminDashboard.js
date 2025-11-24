import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage users and listings</p>
      </div>

      <div className="listings-grid">
        <Link to="/admin/users" className="card" style={{ textDecoration: 'none' }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>User Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            View all users, suspend or ban accounts
          </p>
          <div className="mt-2">
            <span className="badge badge-primary">Manage Users</span>
          </div>
        </Link>

        <Link to="/admin/listings" className="card" style={{ textDecoration: 'none' }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Listing Moderation</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review and remove inappropriate listings
          </p>
          <div className="mt-2">
            <span className="badge badge-primary">Manage Listings</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
