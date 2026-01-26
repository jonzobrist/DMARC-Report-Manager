import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const FlushReportsModal = ({ isOpen, onClose, onFlushComplete }) => {
    const [domain, setDomain] = useState('');
    const [orgName, setOrgName] = useState('');
    const [days, setDays] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string, count?: number }
    const [step, setStep] = useState(1); // 1: Form, 2: Confirmation

    if (!isOpen) return null;

    const resetForm = () => {
        setDomain('');
        setOrgName('');
        setDays('');
        setStartDate('');
        setEndDate('');
        setStatus(null);
        setStep(1);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleFlush = async () => {
        setLoading(true);
        setStatus(null);

        try {
            const params = new URLSearchParams();
            if (domain) params.append('domain', domain);
            if (orgName) params.append('org_name', orgName);
            if (days) params.append('days', days);
            if (startDate) {
                const startTs = Math.floor(new Date(startDate).getTime() / 1000);
                params.append('start', startTs);
            }
            if (endDate) {
                const endTs = Math.floor(new Date(endDate).getTime() / 1000);
                params.append('end', endTs);
            }

            const res = await fetch(`http://localhost:8000/api/reports?${params.toString()}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Deletion failed");

            const data = await res.json();
            setStatus({ type: 'success', message: `Successfully deleted ${data.deleted} reports.`, count: data.deleted });
            if (onFlushComplete) onFlushComplete();

            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: "Failed to delete reports. Check backend logs." });
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '450px' }}>
                <div className="modal-header">
                    <h3 className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trash2 size={20} />
                        Flush Reports
                    </h3>
                    <button className="btn-icon" onClick={handleClose}><X size={20} /></button>
                </div>

                {step === 1 ? (
                    <div className="modal-body">
                        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                            Filter reports to delete. Leave all fields blank to delete <strong>all</strong> reports.
                        </p>

                        <div className="form-group">
                            <label>Domain</label>
                            <input
                                type="text"
                                placeholder="e.g. example.com"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Organization Name</label>
                            <input
                                type="text"
                                placeholder="e.g. google.com"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                            />
                        </div>

                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Last N Days</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 30"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {status?.type === 'error' && (
                            <div className="status-msg error" style={{ marginTop: '1rem' }}>
                                <AlertTriangle size={16} />
                                <span>{status.message}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="modal-body">
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <AlertTriangle size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
                            <h4>Are you sure?</h4>
                            <p className="text-muted">
                                This will permanently delete reports matching your filters. This action cannot be undone.
                            </p>

                            <div className="summary-box" style={{ background: 'rgba(0,0,0,0.05)', padding: '0.75rem', borderRadius: '8px', marginTop: '1rem', textAlign: 'left', fontSize: '0.875rem' }}>
                                <strong>Filters Applied:</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                                    {!domain && !orgName && !days && !startDate && !endDate && <li>Delete everything</li>}
                                    {domain && <li>Domain: {domain}</li>}
                                    {orgName && <li>Org: {orgName}</li>}
                                    {days && <li>Last {days} days</li>}
                                    {startDate && <li>From: {startDate}</li>}
                                    {endDate && <li>To: {endDate}</li>}
                                </ul>
                            </div>
                        </div>

                        {status?.type === 'success' && (
                            <div className="status-msg success" style={{ marginTop: '1rem' }}>
                                <CheckCircle size={16} />
                                <span>{status.message}</span>
                            </div>
                        )}
                        {status?.type === 'error' && (
                            <div className="status-msg error" style={{ marginTop: '1rem' }}>
                                <AlertTriangle size={16} />
                                <span>{status.message}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
                    {step === 1 ? (
                        <button
                            className="btn-danger"
                            onClick={() => setStep(2)}
                            disabled={loading}
                        >
                            Review Deletion
                        </button>
                    ) : (
                        <button
                            className="btn-danger"
                            onClick={handleFlush}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Confirm & Flush'}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }
                .form-group input { 
                    width: 100%; 
                    padding: 0.5rem; 
                    border-radius: 4px; 
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-color);
                }
                .btn-danger {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .btn-danger:hover:not(:disabled) { background: #dc2626; }
                .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default FlushReportsModal;
