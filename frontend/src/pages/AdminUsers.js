import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(50);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (userId === currentUser?.user_id) {
      alert("You cannot change your own status!");
      return;
    }

    const statusMessages = {
      active: 'reactivate',
      suspended: 'suspend',
      banned: 'ban'
    };

    if (!window.confirm(`Are you sure you want to ${statusMessages[newStatus]} this user?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await adminAPI.updateUserStatus(userId, newStatus);
      // Update local state
      setUsers(users.map(user =>
        user.user_id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'suspended': return 'badge-warning';
      case 'banned': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  // Filter users based on search term and status
  const allFilteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Limit displayed users for pagination
  const filteredUsers = allFilteredUsers.slice(0, displayLimit);
  const hasMore = allFilteredUsers.length > displayLimit;

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 50);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Showing {filteredUsers.length} of {allFilteredUsers.length} users
            {allFilteredUsers.length !== users.length && ` (${users.length} total)`}
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      {/* Search and Filters */}
      <div className="card mb-2">
        <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div className="flex gap-1">
          <button
            className={`btn btn-small ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({users.length})
          </button>
          <button
            className={`btn btn-small ${statusFilter === 'active' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({users.filter(u => u.status === 'active').length})
          </button>
          <button
            className={`btn btn-small ${statusFilter === 'suspended' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('suspended')}
          >
            Suspended ({users.filter(u => u.status === 'suspended').length})
          </button>
          <button
            className={`btn btn-small ${statusFilter === 'banned' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('banned')}
          >
            Banned ({users.filter(u => u.status === 'banned').length})
          </button>
        </div>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Joined</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.user_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{user.display_name}</strong>
                  {user.user_id === currentUser?.user_id && (
                    <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>You</span>
                  )}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {user.is_admin ? (
                    <span className="badge badge-primary">Admin</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>User</span>
                  )}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  {user.user_id !== currentUser?.user_id && (
                    <div className="flex gap-1">
                      {user.status !== 'active' && (
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => handleStatusChange(user.user_id, 'active')}
                          disabled={actionLoading === user.user_id}
                        >
                          Activate
                        </button>
                      )}
                      {user.status !== 'suspended' && (
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => handleStatusChange(user.user_id, 'suspended')}
                          disabled={actionLoading === user.user_id}
                        >
                          Suspend
                        </button>
                      )}
                      {user.status !== 'banned' && (
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleStatusChange(user.user_id, 'banned')}
                          disabled={actionLoading === user.user_id}
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Showing {filteredUsers.length} of {allFilteredUsers.length} users
          </p>
          <button className="btn btn-primary" onClick={handleLoadMore}>
            Load More (50)
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
