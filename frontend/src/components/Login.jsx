import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                login(data.user, data.access_token);
                navigate('/');
            } else {
                setError(data.detail || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                        <Shield size={40} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Welcome Back</h1>
                    <p className="text-muted">Sign in to manage your DMARC reports</p>
                </div>

                {error && (
                    <div className="status-badge fail" style={{ width: '100%', marginBottom: '1.5rem', padding: '0.75rem', justifyContent: 'center', boxSizing: 'border-box' }}>
                        <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group" style={{ display: 'flex', flex_direction: 'column', gap: '0.5rem' }}>
                        <label className="form-label">Username</label>
                        <div className="input-container">
                            <User size={16} className="input-icon" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-with-icon"
                                placeholder="Enter username"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flex_direction: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <label className="form-label">Password</label>
                        <div className="input-container">
                            <Lock size={16} className="input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-with-icon"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '2rem', padding: '0.75rem', fontSize: '1rem' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" className="btn-text" style={{ fontSize: '0.875rem' }}>Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
