import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, CheckCircle } from 'lucide-react';

const Settings = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/user/profile');
                if (!res.ok) throw new Error("Failed to fetch profile");
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('http://localhost:8000/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            if (!res.ok) throw new Error("Failed to update profile");
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Dispatch a custom event to notify Layout to refresh the profile
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
        setSaving(false);
    };

    if (loading) return <div className="dashboard-content"><h1>Settings</h1><p>Loading profile...</p></div>;

    return (
        <div className="dashboard-content">
            <header className="content-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your personal information and preferences</p>
                </div>
            </header>

            <div className="card settings-container">
                <div className="card-header">
                    <h3>User Profile</h3>
                </div>
                <div className="chart-wrapper" style={{ height: 'auto', padding: '2.5rem' }}>
                    {message && (
                        <div className={`status-badge ${message.type === 'success' ? 'pass' : 'fail'}`} style={{ width: '100%', marginBottom: '2rem', padding: '0.75rem', justifyContent: 'center', boxSizing: 'border-box' }}>
                            {message.type === 'success' && <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="settings-form">
                        <div className="form-row">
                            <label className="form-label">First Name</label>
                            <div className="input-container">
                                <User size={16} className="input-icon" />
                                <input
                                    type="text"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={handleChange}
                                    placeholder="First Name"
                                    className="input-with-icon"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Last Name</label>
                            <div className="input-container">
                                <User size={16} className="input-icon" />
                                <input
                                    type="text"
                                    name="last_name"
                                    value={profile.last_name}
                                    onChange={handleChange}
                                    placeholder="Last Name"
                                    className="input-with-icon"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Email Address</label>
                            <div className="input-container">
                                <Mail size={16} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    placeholder="Email Address"
                                    className="input-with-icon"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Phone Number</label>
                            <div className="input-container">
                                <Phone size={16} className="input-icon" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    placeholder="Phone Number"
                                    className="input-with-icon"
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <button type="submit" className="btn-primary" disabled={saving} style={{ minWidth: '140px' }}>
                                <Save size={18} style={{ marginRight: '0.5rem' }} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    );
};

export default Settings;
