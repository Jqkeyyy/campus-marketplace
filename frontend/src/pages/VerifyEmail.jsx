import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [success, setSuccess] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = searchParams.get('token');
    window.history.replaceState({}, '', '/verify-email');
    if (!token) {
      setStatus('This verification link is invalid.');
      return;
    }

    authAPI.verifyEmail(token)
      .then((response) => {
        setSuccess(true);
        setStatus(response.data.message);
      })
      .catch((error) => {
        setStatus(error.response?.data?.error || 'Email verification failed.');
      });
  }, [searchParams]);

  return (
    <div className="card" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2 className="page-title">Email verification</h2>
      <div className={success ? 'success-message' : 'text-muted'}>{status}</div>
      <p className="text-center mt-3">
        <Link to={success ? '/login' : '/register'}>
          {success ? 'Continue to login' : 'Return to registration'}
        </Link>
      </p>
    </div>
  );
}

export default VerifyEmail;
