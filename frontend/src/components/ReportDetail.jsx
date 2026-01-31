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

    if (loading) return <div className="p-8">Loading report details...</div>;
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
                                    <th>Source IP</th>
                                    <th>Count</th>
                                    <th>Disposition</th>
                                    <th>DKIM</th>
                                    <th>SPF</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.records.map((record, index) => (
                                    <tr key={index}>
                                        <td className="font-medium font-mono">{record.source_ip}</td>
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
