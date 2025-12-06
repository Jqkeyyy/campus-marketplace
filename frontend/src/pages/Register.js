import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate @uww.edu or @test.com email (for development)
    const email = formData.email.toLowerCase();
    if (!email.endsWith('@uww.edu') && !email.endsWith('@test.com')) {
      setError('Email must be a valid @uww.edu address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        email: formData.email,
        display_name: formData.display_name,
        phone: formData.phone || null,
        password: formData.password
      });

      if (result.success) {
        // Show success message
        setSuccess('Account created successfully! Logging you in...');
        // Navigate to home after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 className="page-title">Register</h2>

      {/* Email verification message commented out - users are immediately active after registration */}
      {/* {success ? (
        <div>
          <div className="success-message">
            {success}
          </div>
          <p className="text-muted">
            Please check your UWW email inbox and click the verification link to activate your account.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      ) : ( */}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div style={{ backgroundColor: '#e7f3ff', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', margin: 0 }}>
          <strong>Note:</strong> Only @uww.edu email addresses are allowed to register.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email * (@uww.edu)</label>
              <input
                type="email"
                className="form-input"
                placeholder="yourname@uww.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
        <div className="form-group">
          <label className="form-label">Display Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone (optional)</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password *</label>
          <input
            type="password"
            className="form-input"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <input
            type="password"
            className="form-input"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      <p className="text-center mt-3">
        Already have an account? <Link to="/login">Login here</Link>
      </p>

      {/* )} Closing brace commented out with email verification */}
    </div>
  );
}

export default Register;
