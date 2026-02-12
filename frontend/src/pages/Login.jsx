import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        tenantSubdomain: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(formData.email, formData.password, formData.tenantSubdomain);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="card auth-box">
                <h2 className="title" style={{ textAlign: 'center' }}>Welcome Back</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Sign in to your account
                </p>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Organization Subdomain</label>
                        <input 
                            type="text" 
                            className="input-field"
                            placeholder="e.g. demo"
                            value={formData.tenantSubdomain}
                            onChange={e => setFormData({...formData, tenantSubdomain: e.target.value})}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input 
                            type="email" 
                            required
                            className="input-field"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input 
                            type="password" 
                            required
                            className="input-field"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Don't have an organization? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Register New Tenant</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
