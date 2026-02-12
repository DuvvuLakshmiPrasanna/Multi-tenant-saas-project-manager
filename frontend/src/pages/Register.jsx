import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const { registerTenant } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminEmail: '',
        adminFullName: '',
        adminPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.adminPassword !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            await registerTenant(formData);
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed');
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-container">
            <div className="card auth-box" style={{ maxWidth: '500px' }}>
                <h2 className="title" style={{ textAlign: 'center' }}>Create Organization</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Start your 14-day free trial
                </p>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Organization Name</label>
                        <input name="tenantName" required className="input-field" onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Subdomain</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input name="subdomain" required className="input-field" style={{ marginBottom: 0 }} onChange={handleChange} />
                            <span style={{ color: 'var(--text-secondary)' }}>.app.com</span>
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Admin Full Name</label>
                        <input name="adminFullName" required className="input-field" onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Admin Email</label>
                        <input name="adminEmail" type="email" required className="input-field" onChange={handleChange} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input name="adminPassword" type="password" required className="input-field" onChange={handleChange} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                        <input name="confirmPassword" type="password" required className="input-field" onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Organization'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
