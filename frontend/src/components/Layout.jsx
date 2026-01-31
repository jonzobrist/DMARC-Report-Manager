import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, Globe, Settings, Shield,
    ChevronLeft, ChevronRight, Database, LogIn, LogOut
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout, isAdmin } = useAuth();


    // Initialize state from cookie, default to true (open) if not set
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const savedState = Cookies.get('sidebar_state');
        return savedState === undefined ? true : savedState === 'true';
    });

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        Cookies.set('sidebar_state', newState, { expires: 365 });
    };

    const [version, setVersion] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/version`)
            .then(res => res.json())
            .then(data => setVersion(data.version))
            .catch(err => console.error("Failed to fetch version", err));
    }, []);

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };


    const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '';
    const fullName = user ? `${user.first_name} ${user.last_name}` : '';

    return (
        <div className={`layout-container ${!isSidebarOpen ? 'collapsed' : ''}`}>
            <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <Shield size={28} className="logo-icon" />
                    {isSidebarOpen && <span className="logo-text">DMARC Mgr</span>}
                </div>

                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>

                <nav className="sidebar-nav">
                    <Link to="/" className={`nav-item ${isActive('/')}`}>
                        <LayoutDashboard size={20} />
                        {isSidebarOpen && <span className="nav-text">Dashboard</span>}
                    </Link>

                    {user && (
                        <>
                            <Link to="/reports" className={`nav-item ${isActive('/reports')}`}>
                                <FileText size={20} />
                                {isSidebarOpen && <span className="nav-text">Reports</span>}
                            </Link>
                            <Link to="/files" className={`nav-item ${isActive('/files')}`}>
                                <Database size={20} />
                                {isSidebarOpen && <span className="nav-text">Files</span>}
                            </Link>
                            <Link to="/domains" className={`nav-item ${isActive('/domains')}`}>
                                <Globe size={20} />
                                {isSidebarOpen && <span className="nav-text">Domains</span>}
                            </Link>
                        </>
                    )}

                    <div className="nav-spacer"></div>
                    <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
                        <Settings size={20} />
                        {isSidebarOpen && <span className="nav-text">Settings</span>}
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    {user ? (
                        <div className="user-profile" style={{ cursor: 'default' }}>
                            <div className="avatar">{userInitials}</div>
                            {isSidebarOpen && (
                                <div className="user-info">
                                    <span className="user-name">{fullName}</span>
                                    <button onClick={logout} className="btn-text" style={{ fontSize: '0.75rem', padding: 0, justifyContent: 'flex-start', color: 'rgba(255,255,255,0.5)' }}>
                                        <LogOut size={12} style={{ marginRight: '4px' }} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="user-profile" style={{ textDecoration: 'none' }}>
                            <div className="avatar" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <LogIn size={18} />
                            </div>
                            {isSidebarOpen && (
                                <div className="user-info">
                                    <span className="user-name">Guest</span>
                                    <span className="user-role" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</span>
                                </div>
                            )}
                        </Link>
                    )}


                    {isSidebarOpen && (
                        <div className="version-info">
                            v{version || '0.0.0'}
                        </div>
                    )}
                </div>
            </aside>


            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
