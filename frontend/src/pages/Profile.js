import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    display_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate display name
    if (formData.display_name.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.updateProfile({
        display_name: formData.display_name,
        phone: formData.phone.trim() || null
      });

      // Update user in AuthContext
      updateUser(response.data);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(e => e.msg).join(', ');
        setError(validationErrors);
      } else {
        setError(err.response?.data?.error || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="page-title">My Profile</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={user?.email || ''}
            disabled
          />
          <small className="text-muted">Email cannot be changed</small>
        </div>

        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Update Profile
        </button>
      </form>
    </div>
  );
}

export default Profile;