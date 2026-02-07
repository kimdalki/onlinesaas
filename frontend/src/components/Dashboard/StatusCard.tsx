import React from 'react';
import './StatusCard.css';

interface StatusCardProps {
    jobId: string | null;
    status: string;
    progress: number;
    errorMessage: string | null;
    originalFileName: string | null;
}

const StatusCard: React.FC<StatusCardProps> = ({
    jobId,
    status,
    progress,
    errorMessage,
    originalFileName,
}) => {
    const getStatusBadgeClass = () => {
        switch (status) {
            case 'Succeeded': return 'success';
            case 'Failed': return 'error';
            case 'Running': return 'running';
            case 'Queued': return 'queued';
            default: return 'idle';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'Succeeded': return '완료';
            case 'Failed': return '실패';
            case 'Running': return '처리 중';
            case 'Queued': return '대기 중';
            default: return '대기';
        }
    };

    return (
        <div className="card status-card">
            <div className="card-header">
                <span className="card-icon">📋</span>
                <h3>Job 상태</h3>
            </div>
            <div className="status-content">
                {!jobId ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <p>DXF 파일을 업로드하면 상태가 표시됩니다</p>
                    </div>
                ) : (
                    <>
                        <div className="status-row">
                            <span className="status-label">파일명</span>
                            <span className="status-value">{originalFileName || '-'}</span>
                        </div>
                        <div className="status-row">
                            <span className="status-label">상태</span>
                            <span className={`status-badge ${getStatusBadgeClass()}`}>
                                {getStatusLabel()}
                            </span>
                        </div>
                        <div className="progress-section">
                            <div className="progress-header">
                                <span>진행률</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                        {errorMessage && (
                            <div className="error-panel">
                                <span className="error-icon">⚠️</span>
                                <p>{errorMessage}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StatusCard;
