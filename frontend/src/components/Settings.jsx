import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, CheckCircle, Trash2, UserPlus, Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserManagement = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', role: 'user' });
    const [msg, setMsg] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setMsg(null);
        try {
            const res = await fetch('http://localhost:8000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ type: 'success', text: 'User created!' });
                setNewUser({ username: '', password: '', first_name: '', last_name: '', email: '', role: 'user' });
                fetchUsers();
            } else {
                const errorText = typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail;
                setMsg({ type: 'error', text: errorText || 'Failed to create user' });
            }
        } catch (err) { setMsg({ type: 'error', text: 'Failed to create user' }); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            const res = await fetch(`http://localhost:8000/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchUsers();
            else {
                const data = await res.json();
                alert(data.detail || 'Failed to delete');
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="card settings-container" style={{ marginTop: '2rem' }}>
            <div className="card-header">
                <h3>User Management</h3>
            </div>
            <div className="chart-wrapper" style={{ height: 'auto', padding: '2.5rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Existing Users</h4>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.first_name} {u.last_name}</td>
                                    <td>{u.username}</td>
                                    <td><span className={`status-badge ${u.role === 'admin' ? 'pass' : 'text-muted'}`} style={{ padding: '2px 8px' }}>{u.role}</span></td>
                                    <td className="text-muted">{u.email}</td>
                                    <td>
                                        <button onClick={() => handleDelete(u.id)} className="btn-text" style={{ color: 'var(--danger)' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <h4 style={{ marginBottom: '1.5rem' }}>Add New User</h4>
                    {msg && (
                        <div className={`status-badge ${msg.type === 'success' ? 'pass' : 'fail'}`} style={{ width: '100%', marginBottom: '1.5rem', padding: '0.75rem', justifyContent: 'center', boxSizing: 'border-box' }}>
                            {msg.text}
                        </div>
                    )}
                    <form onSubmit={handleCreate} className="settings-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <div className="input-container">
                                    <User size={16} className="input-icon" />
                                    <input type="text" className="input-with-icon" placeholder="username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-container">
                                    <Lock size={16} className="input-icon" />
                                    <input type="password" className="input-with-icon" placeholder="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input type="text" className="input-with-icon" style={{ paddingLeft: '1rem' }} placeholder="First Name" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input type="text" className="input-with-icon" style={{ paddingLeft: '1rem' }} placeholder="Last Name" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-container">
                                <Mail size={16} className="input-icon" />
                                <input type="email" className="input-with-icon" placeholder="email@example.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Role</label>
                            <select className="input-with-icon" style={{ paddingLeft: '1rem' }} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="user">Normal User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary">
                                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const Settings = () => {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '' // Optional password update
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch profile");
                const data = await res.json();
                setProfile({ ...data, password: '' });
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };

        if (user) fetchProfile();
    }, [user, authLoading]);

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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(profile)
            });
            if (!res.ok) {
                const data = await res.json();
                const errorText = typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail;
                throw new Error(errorText || "Failed to update profile");
            }
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Dispatch a custom event to notify Layout to refresh the profile
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
        setSaving(false);
    };

    if (authLoading || (loading && user)) return <div className="dashboard-content"><h1>Settings</h1><p>Loading profile...</p></div>;
    if (!user) return null;

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
                    <h3>Your Profile</h3>
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
                            <label className="form-label">Username</label>
                            <div className="input-container">
                                <Shield size={16} className="input-icon" />
                                <input type="text" className="input-with-icon" value={user.username} disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">First Name</label>
                            <div className="input-container">
                                <User size={16} className="input-icon" />
                                <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} placeholder="First Name" className="input-with-icon" required />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Last Name</label>
                            <div className="input-container">
                                <User size={16} className="input-icon" />
                                <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} placeholder="Last Name" className="input-with-icon" required />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Email Address</label>
                            <div className="input-container">
                                <Mail size={16} className="input-icon" />
                                <input type="email" name="email" value={profile.email} onChange={handleChange} placeholder="Email Address" className="input-with-icon" required />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Phone Number</label>
                            <div className="input-container">
                                <Phone size={16} className="input-icon" />
                                <input type="tel" name="phone" value={profile.phone} onChange={handleChange} placeholder="Phone Number" className="input-with-icon" />
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Change Password</label>
                            <div className="input-container">
                                <Lock size={16} className="input-icon" />
                                <input type="password" name="password" value={profile.password} onChange={handleChange} placeholder="Leave blank to keep current" className="input-with-icon" />
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

            {isAdmin && <UserManagement token={user.token} />}
        </div>
    );
};

export default Settings;
