import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, ShieldAlert, Mail, ArrowUpRight, ArrowDownRight, MoreHorizontal, Database, Calendar, Upload } from 'lucide-react';
import Cookies from 'js-cookie';
import ImportModal from './ImportModal';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Initial Date Range: Try Cookie, else default to last 7 days
    const [dateRange, setDateRange] = useState(() => {
        const savedRange = Cookies.get('dashboard_date_range');
        if (savedRange) {
            try {
                return JSON.parse(savedRange);
            } catch (e) {
                console.error("Failed to parse date cookie", e);
            }
        }
        // Default: last 7 days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    });

    const updateDateRange = (start, end) => {
        const newRange = { start, end };
        setDateRange(newRange);
        Cookies.set('dashboard_date_range', JSON.stringify(newRange), { expires: 365 });
    };

    const applyPreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        updateDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    };

    const fetchData = async () => {
        // setLoading(true);
        try {
            // Convert dates to Unix Timestamp (seconds) for Backend
            // Add time to end date (23:59:59) to cover full day
            let startTs = Math.floor(new Date(dateRange.start).getTime() / 1000);
            const endDateObj = new Date(dateRange.end);
            endDateObj.setHours(23, 59, 59, 999);
            let endTs = Math.floor(endDateObj.getTime() / 1000);

            // Validate timestamps – if NaN, fallback to last 7 days
            if (isNaN(startTs) || isNaN(endTs)) {
                const now = new Date();
                const defaultEnd = now;
                const defaultStart = new Date();
                defaultStart.setDate(now.getDate() - 7);
                startTs = Math.floor(defaultStart.getTime() / 1000);
                endTs = Math.floor(defaultEnd.getTime() / 1000);
            }

            const res = await fetch(`http://localhost:8000/api/stats?start=${startTs}&end=${endTs}`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
        // Polling removed to prevent overwriting manual refresh or causing flicker during edits, 
        // user can hit Refresh button.
    }, [dateRange]); // Refetch when date range changes

    // Helper to fill date gaps
    const processVolumeData = (series, start, end) => {
        if (!series && !start) return [];

        const dataMap = new Map();
        if (series) {
            series.forEach(item => dataMap.set(item.name, item));
        }

        const result = [];
        const curr = new Date(start);
        const last = new Date(end);

        while (curr <= last) {
            const dateStr = curr.toISOString().split('T')[0];

            if (dataMap.has(dateStr)) {
                result.push(dataMap.get(dateStr));
            } else {
                // Missing data: pass=0, others undefined nicely for Recharts
                result.push({ name: dateStr, pass: 0 });
            }
            // Next day
            curr.setDate(curr.getDate() + 1);
        }
        return result;
    };

    if (loading && !stats) return <div className="p-8">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    const { total_reports, total_volume, disposition_stats, recent_activity, volume_series } = stats || { total_reports: 0, total_volume: 0, disposition_stats: {}, recent_activity: [], volume_series: [] };

    // Process data for charts vs mock
    const volumeData = processVolumeData(volume_series, dateRange.start, dateRange.end);

    const complianceData = [
        { name: 'Pass', value: disposition_stats?.none || 0 },
        { name: 'Fail', value: (disposition_stats?.quarantine || 0) + (disposition_stats?.reject || 0) },
    ];
    const COLORS = ['#22c55e', '#ef4444'];

    const totalPass = disposition_stats?.none || 0;
    const passRate = total_volume > 0 ? ((totalPass / total_volume) * 100).toFixed(1) : 0;

    const summaryStats = [
        { title: 'Total Reports', value: total_reports.toLocaleString(), icon: Mail, color: '#3b82f6' },
        { title: 'Total Volume', value: total_volume.toLocaleString(), icon: Database, color: '#10b981' },
        { title: 'Failures', value: ((disposition_stats?.quarantine || 0) + (disposition_stats?.reject || 0)).toLocaleString(), icon: ShieldAlert, color: '#ef4444' },
        { title: 'Pass Rate', value: `${passRate}%`, icon: ShieldCheck, color: '#6366f1' },
    ];

    return (
        <div className="dashboard-content">
            <header className="content-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Overview of your DMARC ecosystem</p>
                </div>
                <div className="header-actions">
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginRight: '1rem' }}>
                        <button className="btn-sm" onClick={() => applyPreset(1)}>24h</button>
                        <button className="btn-sm" onClick={() => applyPreset(7)}>7d</button>
                        <button className="btn-sm" onClick={() => applyPreset(14)}>14d</button>
                        <button className="btn-sm" onClick={() => applyPreset(31)}>31d</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', background: '#fff', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <Calendar size={16} className="text-muted" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => updateDateRange(e.target.value, dateRange.end)}
                            className="date-input"
                        />
                        <span className="text-muted">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => updateDateRange(dateRange.start, e.target.value)}
                            className="date-input"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
                            <Upload size={18} style={{ marginRight: '0.5rem' }} />
                            Import
                        </button>
                        <button className="btn-primary" onClick={fetchData}>Refresh</button>
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="stats-grid">
                {summaryStats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-top">
                            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.title}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Visualizations */}
                <div className="chart-section">
                    <div className="card">
                        <div className="card-header">
                            <h3>Volume Overview</h3>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorQuarantine" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} minTickGap={30} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="pass" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPass)" name="Pass" />
                                    <Area type="monotone" dataKey="quarantine" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorQuarantine)" name="Quarantine" />
                                    <Area type="monotone" dataKey="reject" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorReject)" name="Reject" />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="compliance-section">
                    <div className="card">
                        <div className="card-header">
                            <h3>Compliance</h3>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={complianceData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {complianceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="table-section">
                    <div className="card">
                        <div className="card-header">
                            <h3>Recent Reports</h3>
                            <Link to="/reports" className="btn-text">View All</Link>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Organization</th>
                                    <th>Domain</th>
                                    <th>Volume / Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent_activity.map(report => (
                                    <tr key={report.id} className="clickable-row">
                                        <td className="font-medium">
                                            <Link to={`/report/${report.id}`} className="table-link">
                                                {report.org_name}
                                            </Link>
                                        </td>
                                        <td className="text-muted">{report.domain}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                                <span className="font-medium">{report.total_count}</span>
                                                <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', width: '80px', display: 'flex', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(report.pass_count / report.total_count) * 100}%`, background: '#22c55e' }}></div>
                                                    <div style={{ width: `${(report.fail_count / report.total_count) * 100}%`, background: '#ef4444' }}></div>
                                                </div>
                                                {report.fail_count > 0 && <span className="text-xs text-danger">{report.fail_count} fail</span>}
                                            </div>
                                        </td>
                                        <td className="text-muted">{new Date(report.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ImportModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadComplete={fetchData}
            />
        </div>
    );
};

export default Dashboard;
