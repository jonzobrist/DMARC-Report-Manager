import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Globe, Shield, Activity, BarChart3, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const DomainList = () => {
    const { user, loading: authLoading } = useAuth();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchDomains = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const res = await fetch('http://localhost:8000/api/domains', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch domains");
                const data = await res.json();
                setDomains(data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchDomains();
    }, []);

    const filteredDomains = domains.filter(d =>
        d.domain.toLowerCase().includes(search.toLowerCase())
    );

    const handleDomainClick = (domainName) => {
        navigate(`/reports?domain=${domainName}`);
    };

    return (
        <div className="dashboard-content">
            <header className="content-header">
                <div>
                    <h1>Managed Domains</h1>
                    <p>Aggregate performance across all active domains</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Filter domains..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            width: '250px',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </header>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Reports</th>
                            <th>Volume</th>
                            <th>Policy Compliance</th>
                            <th>Status Stats</th>
                            <th>Last Seen</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center p-4">Loading domains...</td></tr>
                        ) : filteredDomains.length === 0 ? (
                            <tr><td colSpan="7" className="text-center p-4">No domains found.</td></tr>
                        ) : (
                            filteredDomains.map((d) => {
                                const passRate = d.total_volume > 0 ? (d.pass_count / d.total_volume) * 100 : 0;
                                return (
                                    <tr key={d.domain} className="clickable-row" onClick={() => handleDomainClick(d.domain)}>
                                        <td className="font-medium">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar-sm" style={{ background: '#10b98120', color: '#10b981' }}>
                                                    <Globe size={16} />
                                                </div>
                                                {d.domain}
                                            </div>
                                        </td>
                                        <td>{d.report_count}</td>
                                        <td className="text-muted">{d.total_volume.toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, height: '8px', background: '#334155', borderRadius: '4px', width: '100px', overflow: 'hidden', display: 'flex' }}>
                                                    <div style={{ width: `${passRate}%`, background: '#10b981' }}></div>
                                                    <div style={{ width: `${100 - passRate}%`, background: '#ef4444' }}></div>
                                                </div>
                                                <span className="text-sm font-medium">{Math.round(passRate)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {d.quarantine_count > 0 && <span className="status-badge warning" title="Quarantine count">{d.quarantine_count}</span>}
                                                {d.reject_count > 0 && <span className="status-badge error" title="Reject count">{d.reject_count}</span>}
                                                {d.quarantine_count === 0 && d.reject_count === 0 && <span className="status-badge pass">All Pass</span>}
                                            </div>
                                        </td>
                                        <td className="text-muted text-sm">{new Date(d.last_seen * 1000).toLocaleDateString()}</td>
                                        <td>
                                            <ChevronRight size={18} className="text-muted" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DomainList;
