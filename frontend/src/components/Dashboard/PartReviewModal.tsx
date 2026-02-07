import React from 'react';
import SVGViewer from '../SVGViewer/SVGViewer';
import type { Part } from '../../types/Part';
import './PartReviewModal.css';

interface PartReviewModalProps {
    part: Part;
    svgElements: any[];
    gridLines: any[];
    bounds: any;
    onClose: () => void;
    onConfirm: (part: Part) => void;
}

const PartReviewModal: React.FC<PartReviewModalProps> = ({
    part,
    svgElements,
    gridLines,
    bounds,
    onClose,
    onConfirm,
}) => {
    const steps = [
        { id: 1, label: 'Part Review', active: true },
        { id: 2, label: 'Material', active: false },
        { id: 3, label: 'Services', active: false },
        { id: 4, label: 'Finishing', active: false },
    ];

    // Parse dimensions
    const dims = part.dimensions || '0 × 0 mm';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header with Steps */}
                <div className="modal-header">
                    <div className="modal-brand">
                        <svg className="brand-logo" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>FABRICORE</span>
                    </div>

                    <div className="steps-container">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className={`step ${step.active ? 'active' : ''}`}>
                                    <span className="step-number">{step.id}</span>
                                    <span className="step-label">{step.label}</span>
                                </div>
                                {index < steps.length - 1 && <div className="step-connector" />}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="file-id">
                        <span className="file-id-label">FILE ID</span>
                        <span className="file-id-value">DXF-{part.id.slice(0, 5).toUpperCase()}</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="modal-body">
                    {/* Viewer Section */}
                    <div className="viewer-section">
                        <div className="viewer-container">
                            {svgElements.length > 0 ? (
                                <SVGViewer
                                    svgElements={svgElements}
                                    gridLines={gridLines}
                                    bounds={bounds}
                                    fileName={part.fileName}
                                    dimensions={dims}
                                />
                            ) : (
                                <div className="viewer-placeholder">
                                    <span>Loading preview...</span>
                                </div>
                            )}
                        </div>

                        {/* Viewer Controls */}
                        <div className="viewer-controls">
                            <button className="control-btn" title="Zoom In">
                                <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" /><line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" strokeWidth="2" /><line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" /></svg>
                            </button>
                            <button className="control-btn" title="Zoom Out">
                                <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" /><line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" /></svg>
                            </button>
                            <button className="control-btn" title="Fit to View">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                            <button className="control-btn" title="Layers">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" /><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" /><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="info-panel">
                        <h2 className="panel-title">Part Review</h2>
                        <p className="panel-subtitle">
                            We've analyzed your file. Please review the details below before proceeding to material selection.
                        </p>

                        {/* Issue Alert */}
                        <div className="issue-alert">
                            <div className="alert-icon">
                                <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="16" r="1" fill="currentColor" /></svg>
                            </div>
                            <div className="alert-content">
                                <h4>Manufacturability Issue</h4>
                                <p>This part has <a href="#">open entities</a> that may prevent precise laser cutting.</p>
                            </div>
                        </div>

                        {/* Issue Details */}
                        <div className="issue-details">
                            <div className="issue-column">
                                <span className="column-label">CURRENT ISSUES</span>
                                <div className="issue-icon error">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 8C12 8 12 8 12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span className="issue-label">Open Path</span>
                            </div>
                            <div className="issue-column">
                                <span className="column-label">GUIDE</span>
                                <div className="issue-icon success">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="issue-label">Closed Path</span>
                            </div>
                        </div>

                        {/* How to fix */}
                        <div className="how-to-fix">
                            <h4>How to fix?</h4>
                            <ol>
                                <li>Ensure all endpoints of your drawing segments are snapped together.</li>
                                <li>Remove any duplicate overlapping lines.</li>
                                <li><a href="#">Read our full design guide →</a></li>
                            </ol>
                        </div>

                        {/* File Info */}
                        <div className="file-info">
                            <div className="info-row">
                                <span className="info-label">Filename</span>
                                <span className="info-value">{part.fileName}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">File Type</span>
                                <span className="info-value">{part.fileType || 'AutoCAD DXF R12'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Detected Bends</span>
                                <span className="info-value">1</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="materials-btn">
                        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M3 9H21" stroke="currentColor" strokeWidth="2" /><path d="M9 21V9" stroke="currentColor" strokeWidth="2" /></svg>
                        Materials Library
                    </button>
                    <div className="footer-actions">
                        <button className="close-btn" onClick={onClose}>CLOSE</button>
                        <button className="confirm-btn" onClick={() => onConfirm(part)}>CONFIRM PART</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartReviewModal;
