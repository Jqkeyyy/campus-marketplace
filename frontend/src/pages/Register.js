import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

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
  const [verificationLink, setVerificationLink] = useState('');
  const navigate = useNavigate();

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
      const response = await authAPI.register({
        email: formData.email,
        display_name: formData.display_name,
        phone: formData.phone || null,
        password: formData.password
      });

      setSuccess(response.data.message);
      // For testing only - show the verification link
      if (response.data.verificationLink) {
        setVerificationLink(response.data.verificationLink);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(e => e.msg).join(', ');
        setError(validationErrors);
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 className="page-title">Register</h2>

      {success ? (
        <div>
          <div className="success-message" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            {success}
          </div>
          <p className="text-muted" style={{ marginBottom: '15px' }}>
            Please check your UWW email inbox and click the verification link to activate your account.
          </p>
          {verificationLink && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', marginBottom: '5px' }}>
                <strong>For Testing:</strong> Click the link below to verify
              </p>
              <a href={verificationLink} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {verificationLink}
              </a>
            </div>
          )}
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}
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
        </>
      )}
    </div>
  );
}

export default Register;
