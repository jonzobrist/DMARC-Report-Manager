import React, { useState, useRef } from 'react';
import { X, Upload, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


const ImportModal = ({ isOpen, onClose, onUploadComplete }) => {
    const { user } = useAuth();
    const [dragActive, setDragActive] = useState(false);

    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error'
    const inputRef = useRef(null);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (fileList) => {
        setFiles([...files, ...Array.from(fileList)]);
        setUploadStatus(null);
    };

    const removeFile = (idx) => {
        const newFiles = [...files];
        newFiles.splice(idx, 1);
        setFiles(newFiles);
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;
        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append("files", file);
        });

        try {
            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData,
            });


            if (!res.ok) throw new Error("Upload failed");

            setUploadStatus('success');
            setFiles([]);
            if (onUploadComplete) onUploadComplete();

            // Auto close after success? Or let user close.
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            console.error(err);
            setUploadStatus('error');
        }
        setUploading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Import DMARC Reports</h3>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div
                    className={`drop-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden-input"
                        onChange={handleChange}
                        accept=".xml,.gz,.zip"
                    />
                    <Upload size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                    <p>Drag & Drop files here or <span className="text-primary">Browse</span></p>
                    <p className="text-sm text-muted">Supports .xml, .gz, .zip</p>
                </div>

                {files.length > 0 && (
                    <div className="file-list">
                        {files.map((file, idx) => (
                            <div key={idx} className="file-item">
                                <FileIcon size={16} />
                                <span className="file-name">{file.name}</span>
                                <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {uploadStatus === 'success' && (
                    <div className="status-msg success">
                        <CheckCircle size={16} />
                        <span>Upload Successful! Processing...</span>
                    </div>
                )}
                {uploadStatus === 'error' && (
                    <div className="status-msg error">
                        <AlertCircle size={16} />
                        <span>Upload Failed. Check console.</span>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={uploadFiles}
                        disabled={files.length === 0 || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                }
                .modal-content {
                    background: var(--card-bg);
                    padding: 1.5rem;
                    border-radius: 12px;
                    width: 500px;
                    max-width: 90vw;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border: 1px solid var(--border-color);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .drop-zone {
                    border: 2px dashed var(--border-color);
                    border-radius: 8px;
                    padding: 3rem 1.5rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(255,255,255,0.02);
                }
                .drop-zone.active, .drop-zone:hover {
                    border-color: var(--primary);
                    background: rgba(59, 130, 246, 0.05); /* Blue tint */
                }
                .hidden-input { display: none; }
                .file-list {
                    margin-top: 1rem;
                    max-height: 150px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .file-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                    font-size: 0.875rem;
                }
                .file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .modal-footer {
                    margin-top: 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
                .status-msg {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }
                .status-msg.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .status-msg.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
            `}</style>
        </div>
    );
};

export default ImportModal;
