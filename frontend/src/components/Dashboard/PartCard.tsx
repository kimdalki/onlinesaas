import React, { useMemo } from 'react';
import type { Part } from '../../types/Part';
import './PartCard.css';

export type { Part };

interface PartCardProps {
    part: Part;
    isSelected?: boolean;
    onView: (part: Part) => void;
    onSelect?: (part: Part) => void;
    onAddToCart?: (part: Part) => void;
    onDownload?: (part: Part) => void;
    onDuplicate?: (part: Part) => void;
    onDelete?: (part: Part) => void;
}

const PartCard: React.FC<PartCardProps> = ({
    part,
    isSelected = false,
    onView,
    onSelect,
    onAddToCart,
    onDownload,
    onDuplicate,
    onDelete,
}) => {
    // Calculate viewBox from bounds
    const viewBox = useMemo(() => {
        if (!part.svgData?.bounds) return '0 0 100 100';
        const { minX, minY, maxX, maxY } = part.svgData.bounds;
        const padding = 1;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        return `${minX - padding} ${minY - padding} ${width} ${height}`;
    }, [part.svgData?.bounds]);

    // Render SVG element based on svgRenderer output format
    const renderSvgElement = (el: any, index: number) => {
        if (!el || !el.type) return null;

        // svgRenderer returns { type, data, isBendLine, layer }
        if (el.type === 'path' && el.data) {
            return (
                <path
                    key={index}
                    d={el.data}
                    stroke="#333333"
                    strokeWidth={0.5}
                    fill="none"
                />
            );
        }

        if (el.type === 'circle' && el.data) {
            return (
                <circle
                    key={index}
                    cx={el.data.cx}
                    cy={el.data.cy}
                    r={el.data.r}
                    stroke="#333333"
                    strokeWidth={0.5}
                    fill="none"
                />
            );
        }

        if (el.type === 'text' && el.data) {
            return (
                <text
                    key={index}
                    x={el.data.x}
                    y={el.data.y}
                    fontSize={el.data.fontSize || 10}
                    fill="#333333"
                >
                    {el.data.text}
                </text>
            );
        }

        return null;
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(part);
    };

    return (
        <div
            className={`part-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onView(part)}
        >
            {/* Selection checkbox */}
            <div
                className={`part-checkbox ${isSelected ? 'checked' : ''}`}
                onClick={handleCheckboxClick}
            >
                {isSelected && (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>

            <div className="part-thumbnail">
                {part.status === 'processing' ? (
                    <div className="part-loading">
                        <div className="part-spinner"></div>
                        <span>Processing...</span>
                    </div>
                ) : part.svgData?.elements && part.svgData.elements.length > 0 ? (
                    <svg
                        viewBox={viewBox}
                        className="part-svg-preview"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {part.svgData.elements.map(renderSvgElement)}
                    </svg>
                ) : part.thumbnailUrl ? (
                    <img src={part.thumbnailUrl} alt={part.fileName} />
                ) : (
                    <div className="part-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="part-info">
                <h4 className="part-name">{part.fileName}</h4>
                <p className="part-dimensions">{part.dimensions}</p>
            </div>

            <div className="part-actions" onClick={(e) => e.stopPropagation()}>
                <button
                    className="add-to-cart-btn"
                    onClick={() => onAddToCart?.(part)}
                >
                    ADD TO CART
                </button>
                <div className="action-icons">
                    <button className="icon-btn" onClick={() => onView(part)} title="View">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                    <button className="icon-btn" onClick={() => onDownload?.(part)} title="Download">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button className="icon-btn" onClick={() => onDuplicate?.(part)} title="Duplicate">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                    <button className="icon-btn" onClick={() => onDelete?.(part)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartCard;
