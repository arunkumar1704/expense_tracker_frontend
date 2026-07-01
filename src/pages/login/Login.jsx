import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import './login.css';

function Login() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!otpSent && !loginData.password.trim()) {
      toast.error('Password is required');
      return;
    }
    if (otpSent && !loginData.otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      setIsLoading(true);

      if (!otpSent) {
        const res = await API.post('/login', {
          email: loginData.email,
          password: loginData.password,
        });
        if (res.data.success) {
          toast.success(res.data.message);
          setOtpSent(true);
        }
      } else {
        const res = await API.post('/login/verify', {
          email: loginData.email,
          otp: loginData.otp,
        });
        if (res.data.success) {
          localStorage.setItem('auth_token', res.data.token);
          toast.success(res.data.message);
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const res = await API.post('/login', {
        email: loginData.email,
        password: loginData.password,
      });
      if (res.data.success) {
        toast.info('OTP resent to your email!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">💰</div>
          <h2>Welcome Back</h2>
          <p>{otpSent ? 'Enter the OTP sent to your email' : 'Login to your account'}</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={loginData.email}
              onChange={handleChange}
              disabled={otpSent}
              autoComplete="email"
            />
          </div>

          {!otpSent && (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          )}

          {otpSent && (
            <div className="form-group">
              <label>OTP Code</label>
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={loginData.otp}
                onChange={handleChange}
                maxLength="6"
                className="otp-input"
              />
              <div className="resend-otp">
                <button type="button" className="resend-btn" onClick={handleResendOtp} disabled={isLoading}>
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? 'Please wait...' : otpSent ? '✅ Verify OTP' : '📧 Send OTP'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
