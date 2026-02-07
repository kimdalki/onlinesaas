import React from 'react';
import SVGViewer from '../SVGViewer/SVGViewer';
import './ViewerCard.css';

interface ViewerCardProps {
    svgElements: any[];
    gridLines: any[];
    bounds: any;
    fileName: string;
}

const ViewerCard: React.FC<ViewerCardProps> = ({
    svgElements,
    gridLines,
    bounds,
    fileName,
}) => {
    const hasContent = svgElements.length > 0;

    return (
        <div className="card viewer-card">
            <div className="card-header">
                <span className="card-icon">🔍</span>
                <h3>SVG 뷰어</h3>
                {fileName && <span className="viewer-filename">{fileName}</span>}
            </div>
            <div className="viewer-content">
                {hasContent ? (
                    <SVGViewer
                        svgElements={svgElements}
                        gridLines={gridLines}
                        bounds={bounds}
                        fileName={fileName}
                    />
                ) : (
                    <div className="empty-viewer">
                        <span className="empty-icon">🖼️</span>
                        <p>DXF 파일을 업로드하면 뷰어가 표시됩니다</p>
                        <span className="viewer-hint">마우스 휠: 줌, 드래그: 이동</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewerCard;
