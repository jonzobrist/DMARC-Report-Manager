import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


const ReportDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchReport = async () => {
            if (!user) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                if (!res.ok) throw new Error("Report not found");
                const data = await res.json();
                setReport(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    const ReportDetailSkeleton = () => (
        <div className="report-detail-container">
            <header className="detail-header">
                <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
                <div className="report-title">
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-text" style={{ width: '300px' }}></div>
                </div>
            </header>
            <div className="detail-grid">
                <div className="card">
                    <div className="card-header"><div className="skeleton skeleton-text" style={{ width: '50%' }}></div></div>
                    <div className="card-body policy-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-text" style={{ height: '3rem' }}></div>
                        ))}
                    </div>
                </div>
                <div className="card full-width">
                    <div className="card-header"><div className="skeleton skeleton-text" style={{ width: '30%' }}></div></div>
                    <div style={{ padding: '1rem' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton skeleton-text" style={{ height: '2rem', marginBottom: '1rem' }}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return <ReportDetailSkeleton />;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!report) return null;

    return (
        <div className="report-detail-container">
            <header className="detail-header">
                <Link to="/reports" className="back-link">
                    <ArrowLeft size={20} />
                    Back to Reports
                </Link>
                <div className="report-title">
                    <h1>Report Details: {report.org_name}</h1>
                    <span className="report-meta">
                        ID: {report.report_id} • {new Date(report.date_end * 1000).toLocaleString()}
                    </span>
                </div>
            </header>

            <div className="detail-grid">
                {/* Policy Card */}
                <div className="card">
                    <div className="card-header">
                        <h3>Published Policy</h3>
                        <div className="badge">{report.domain}</div>
                    </div>
                    <div className="card-body policy-grid">
                        <div className="policy-item">
                            <span className="label">Policy (p)</span>
                            <span className="value">{report.policy_published.p || 'none'}</span>
                        </div>
                        <div className="policy-item">
                            <span className="label">Subdomain Policy (sp)</span>
                            <span className="value">{report.policy_published.sp || 'unspecified'}</span>
                        </div>
                        <div className="policy-item">
                            <span className="label">Percentage (pct)</span>
                            <span className="value">{report.policy_published.pct}%</span>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="card full-width">
                    <div className="card-header">
                        <h3>Authentication Results</h3>
                        <span className="text-muted text-sm">{report.records.length} records</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Source IP & Hostname</th>
                                    <th>Origin</th>
                                    <th>Count</th>
                                    <th>Disposition</th>
                                    <th>DKIM</th>
                                    <th>SPF</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.records.map((record, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="font-mono font-medium">{record.source_ip}</div>
                                            {record.enrichment?.rdns && (
                                                <div className="text-muted" style={{ fontSize: '0.7rem', wordBreak: 'break-all', marginTop: '2px' }}>
                                                    {record.enrichment.rdns}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {record.enrichment?.country_code && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span className="status-badge" style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                                                        {record.enrichment.country_code}
                                                    </span>
                                                    {record.enrichment.country_name && (
                                                        <span className="text-xs" title={record.enrichment.country_name}>
                                                            {record.enrichment.country_name}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {record.enrichment?.asn_name && (
                                                <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }} title={`AS${record.enrichment.asn}`}>
                                                    {record.enrichment.asn_name}
                                                </div>
                                            )}
                                        </td>
                                        <td>{record.count}</td>
                                        <td>
                                            <span className={`status-badge ${(!record.disposition || record.disposition === 'none') ? 'pass' : 'fail'}`}>
                                                {record.disposition || 'none'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="auth-result">
                                                {record.dkim === 'pass' ? <CheckCircle size={16} color="#22c55e" /> :
                                                    record.dkim === 'fail' ? <XCircle size={16} color="#ef4444" /> :
                                                        <AlertCircle size={16} className="text-muted" />}
                                                <span>{record.dkim ? record.dkim.toUpperCase() : 'NONE'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="auth-result">
                                                {record.spf === 'pass' ? <CheckCircle size={16} color="#22c55e" /> :
                                                    record.spf === 'fail' ? <XCircle size={16} color="#ef4444" /> :
                                                        <AlertCircle size={16} className="text-muted" />}
                                                <span>{record.spf ? record.spf.toUpperCase() : 'NONE'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDetail;
