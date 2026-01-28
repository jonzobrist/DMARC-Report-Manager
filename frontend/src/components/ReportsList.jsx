import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Search, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';

const ReportsList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const domainFilter = searchParams.get('domain');

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 20, // 20 per page
            });
            if (search) params.append('search', search);
            if (domainFilter) params.append('domain', domainFilter);

            const res = await fetch(`http://localhost:8000/api/reports?${params}`);
            if (!res.ok) throw new Error("Failed to fetch reports");
            const data = await res.json();

            setReports(data.items);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(() => {
            fetchReports();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, domainFilter]);

    const clearDomainFilter = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('domain');
        setSearchParams(newParams);
        setPage(1);
    };

    return (
        <div className="dashboard-content">
            <header className="content-header">
                <div>
                    <h1>DMARC Reports</h1>
                    <p>
                        {domainFilter ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Filtering by domain: <strong className="text-primary">{domainFilter}</strong>
                                <button className="btn-icon-sm" onClick={clearDomainFilter} title="Clear domain filter">
                                    <X size={14} />
                                </button>
                            </span>
                        ) : (
                            "All processed DMARC reports"
                        )}
                    </p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search Org, ID, or Domain..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}

                        style={{
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            width: '300px',
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
                            <th>Organization</th>
                            <th>Report ID</th>
                            <th>Domain</th>
                            <th>Date Range End</th>
                            <th>Volume / Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-4">Loading reports...</td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-4">No reports found.</td></tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.id} className="clickable-row">
                                    <td className="font-medium">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="avatar-sm" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                                                {report.org_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {report.org_name}
                                        </div>
                                    </td>
                                    <td className="text-muted font-mono text-sm">{report.report_id}</td>
                                    <td>{report.domain}</td>
                                    <td>{new Date(report.date_end * 1000).toLocaleDateString()}</td>
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
                                    <td>
                                        <Link to={`/report/${report.id}`} className="btn-icon-sm" title="View Details">
                                            <Eye size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination-footer" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <span className="text-muted text-sm">
                        Showing {reports.length} of {totalItems} reports
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn-secondary"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-sm" style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="btn-secondary"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsList;
