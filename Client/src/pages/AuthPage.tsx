import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, signup, connectedStore, setConnectedStore } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeDomain, setStoreDomain] = useState(connectedStore);
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#6b7280' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 20, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score: 60, label: 'Fair', color: '#f59e0b' };
    if (score === 4) return { score: 80, label: 'Good', color: '#3b82f6' };
    return { score: 100, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setConnectedStore(storeDomain);

    try {
      if (isSignUp) {
        await signup(username, email || `${username}@copilot.erp`, password);
      } else {
        await login(username, password, true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="mesh-bg"></div>

      <div className="auth-card-container">
        <div className="auth-brand">
          <div className="brand-logo">🛒</div>
          <h1>Copilot ERP OS</h1>
          <p>Enterprise Resource Planning for Shopify Stores</p>
        </div>

        <div className="store-pill">
          <ShoppingBag size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Connecting to:</span>
          <input
            type="text"
            className="store-input"
            value={storeDomain}
            onChange={(e) => setStoreDomain(e.target.value)}
          />
        </div>

        <div className={`auth-flip-card ${isSignUp ? 'flipped' : ''}`}>
          {/* LOGIN SIDE */}
          <div className="auth-card-front">
            <h2 className="auth-title">Sign In to Dashboard</h2>
            <form onSubmit={handleSubmit} className="erp-form">
              <div className="erp-input-group">
                <label>Username / Account ID</label>
                <div className="input-icon-wrap">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    type="text"
                    className="erp-input with-icon"
                    required
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="erp-input-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    className="erp-input with-icon"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="erp-btn erp-btn-primary auth-submit-btn" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Workspace'} <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => login('admin', 'admin', true)}
                className="erp-btn erp-btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              >
                ⚡ Quick Demo Sign In
              </button>
            </form>

            <div className="auth-footer-toggle">
              Don't have an ERP account?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="auth-link">
                Create Account
              </button>
            </div>
          </div>

          {/* SIGNUP SIDE */}
          <div className="auth-card-back">
            <h2 className="auth-title">Create Admin Account</h2>
            <form onSubmit={handleSubmit} className="erp-form">
              <div className="erp-input-group">
                <label>Username *</label>
                <div className="input-icon-wrap">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    type="text"
                    className="erp-input with-icon"
                    required
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="erp-input-group">
                <label>Work Email Address *</label>
                <div className="input-icon-wrap">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="erp-input with-icon"
                    required
                    placeholder="john@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="erp-input-group">
                <label>Secure Password *</label>
                <div className="input-icon-wrap">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    className="erp-input with-icon"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {password && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                      <span>Strength:</span>
                      <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'all 0.3s' }}></div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="erp-btn erp-btn-primary auth-submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account & Launch'} <ShieldCheck size={16} />
              </button>
            </form>

            <div className="auth-footer-toggle">
              Already registered?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="auth-link">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
