import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Globe, Settings, Shield, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import Cookies from 'js-cookie';

const Layout = ({ children }) => {
    const location = useLocation();

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
        fetch('http://localhost:8000/api/version')
            .then(res => res.json())
            .then(data => setVersion(data.version))
            .catch(err => console.error("Failed to fetch version", err));
    }, []);

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

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
                    <div className="nav-spacer"></div>
                    <Link to="#" className={`nav-item ${isActive('/settings')}`}>
                        <Settings size={20} />
                        {isSidebarOpen && <span className="nav-text">Settings</span>}
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">JD</div>
                        {isSidebarOpen && (
                            <div className="user-info">
                                <span className="user-name">John Doe</span>
                                <span className="user-role">Admin</span>
                            </div>
                        )}
                    </div>
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
