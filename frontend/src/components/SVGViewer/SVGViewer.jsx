import React, { useState, useRef, useEffect } from 'react';
import './SVGViewer.css';

const SVGViewer = ({ svgElements, gridLines, bounds, fileName, dimensions }) => {
    const [showDimensions, setShowDimensions] = useState(false);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [hoveredElement, setHoveredElement] = useState(null);
    const [selectedElement, setSelectedElement] = useState(null);  // 선택된 절곡선
    const svgRef = useRef(null);

    // 줌 핸들러
    const handleWheel = (e) => {
        e.preventDefault();

        // 줌 인/아웃 비율을 정확한 역수로 설정하여 위치 드리프트 방지
        const ZOOM_FACTOR = 1.1;
        const delta = e.deltaY > 0 ? (1 / ZOOM_FACTOR) : ZOOM_FACTOR;
        const newScale = Math.max(1.0, Math.min(10, transform.scale * delta));  // 최소 100% (1.0)

        // 뷰포트 중심을 기준으로 줌 (영역 이동 방지)
        // 주의: svgRef.current는 transform이 적용되어 크기가 변하므로, 
        // 변하지 않는 부모 컨테이너(svg-wrapper)를 기준으로 중심을 잡아야 함.
        const wrapper = svgRef.current.parentElement;
        const rect = wrapper.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const newX = centerX - (centerX - transform.x) * (newScale / transform.scale);
        const newY = centerY - (centerY - transform.y) * (newScale / transform.scale);

        setTransform({ x: newX, y: newY, scale: newScale });
    };

    // 팬 시작
    const handleMouseDown = (e) => {
        if (e.button === 0) { // 왼쪽 마우스 버튼
            setIsPanning(true);
            setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    };

    // 팬 중
    const handleMouseMove = (e) => {
        if (isPanning) {
            setTransform({
                ...transform,
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    };

    // 팬 종료
    const handleMouseUp = () => {
        setIsPanning(false);
    };

    // 리셋 버튼
    const handleReset = () => {
        setTransform({ x: 0, y: 0, scale: 1 });
    };

    // 마우스 휠 이벤트 리스너 (passive: false로 설정하여 preventDefault 가능하게)
    useEffect(() => {
        const svgElement = svgRef.current?.parentElement;
        if (!svgElement) return;

        const wheelHandler = (e) => {
            e.preventDefault();

            setTransform(prev => {
                // 줌 인/아웃 비율을 정확한 역수로 설정하여 위치 드리프트 방지
                const ZOOM_FACTOR = 1.1;
                const delta = e.deltaY > 0 ? (1 / ZOOM_FACTOR) : ZOOM_FACTOR;
                const newScale = Math.max(1.0, Math.min(10, prev.scale * delta));  // 최소 100% (1.0)

                // SVG 자체가 CSS로 중앙 정렬되어 있으므로, SVG의 중심(400, 300)을 기준으로 줌
                const centerX = 400;
                const centerY = 300;

                const newX = centerX - (centerX - prev.x) * (newScale / prev.scale);
                const newY = centerY - (centerY - prev.y) * (newScale / prev.scale);

                return { x: newX, y: newY, scale: newScale };
            });
        };

        svgElement.addEventListener('wheel', wheelHandler, { passive: false });
        // 의존성 배열인 []이므로 마운트 시 한 번만 실행됨
        return () => svgElement.removeEventListener('wheel', wheelHandler);
    }, [svgElements]); // svgElements가 로드되어 SVG가 렌더링된 후에 리스너가 등록되도록 수정

    // 마우스가 SVG 밖으로 나갔을 때
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsPanning(false);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // 배경 클릭 시 선택 해제
    const handleBackgroundClick = (e) => {
        // SVG 배경을 직접 클릭한 경우에만 선택 해제
        if (e.target.tagName === 'svg' || e.target.classList.contains('svg-wrapper')) {
            setSelectedElement(null);
        }
    };

    // 절곡선 클릭 핸들러
    const handleBendLineClick = (index, e) => {
        e.stopPropagation();  // 이벤트 버블링 방지
        if (selectedElement === index) {
            setSelectedElement(null);  // 이미 선택된 경우 해제
        } else {
            setSelectedElement(index);  // 새로 선택
        }
    };

    if (!svgElements || svgElements.length === 0) {
        return (
            <div className="svg-viewer-empty">
                <p>DXF 파일을 업로드하면 여기에 표시됩니다</p>
            </div>
        );
    }

    return (
        <div className="svg-viewer-container">
            <div className="svg-viewer-header">
                <h3 className="file-name">{fileName || 'DXF 뷰어'}</h3>
                <div className="viewer-controls">
                    <button onClick={handleReset} className="control-button">
                        🔄 리셋
                    </button>
                    {dimensions && (
                        <div className="dimensions-wrapper">
                            <button
                                className={`control-button ${showDimensions ? 'active' : ''}`}
                                onClick={() => setShowDimensions(!showDimensions)}
                                title="치수 정보 보기"
                            >
                                📏 치수
                            </button>
                            {showDimensions && (
                                <div className="dimensions-tooltip">
                                    <div className="tooltip-header">Dimensions</div>
                                    <div className="tooltip-content">{dimensions}</div>
                                </div>
                            )}
                        </div>
                    )}
                    <span className="zoom-level">줌: {(transform.scale * 100).toFixed(0)}%</span>
                </div>
            </div>

            <div
                className={`svg-wrapper ${isPanning ? 'panning' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg
                    ref={svgRef}
                    width="800"
                    height="600"
                    viewBox="0 0 800 600"
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transformOrigin: '0 0'
                    }}
                    onClick={handleBackgroundClick}
                >
                    {/* 화살표 마커 정의 */}
                    <defs>
                        <marker
                            id="arrow-start"
                            markerWidth="8"
                            markerHeight="8"
                            refX="4"
                            refY="4"
                            orient="auto"
                        >
                            <polygon points="8,4 0,0 0,8" fill="#333" />
                        </marker>
                        <marker
                            id="arrow-end"
                            markerWidth="8"
                            markerHeight="8"
                            refX="4"
                            refY="4"
                            orient="auto"
                        >
                            <polygon points="0,4 8,0 8,8" fill="#333" />
                        </marker>
                    </defs>

                    {/* 그리드 */}
                    <g className="grid-group">
                        {gridLines && gridLines.map((line, index) => (
                            <line
                                key={`grid-${index}`}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                className={line.isMajor ? 'grid-line-major' : 'grid-line'}
                            />
                        ))}
                    </g>

                    {/* DXF 엔티티 */}
                    <g className="entities-group">
                        {svgElements.map((element, index) => {
                            if (!element) return null;

                            // 줌 레벨에 관계없이 일정한 선 두께 유지
                            const baseStrokeWidth = 1.5;
                            const adjustedStrokeWidth = baseStrokeWidth / transform.scale;
                            const hoverZoneWidth = 20 / transform.scale;  // 호버 영역 두께

                            if (element.type === 'path') {
                                if (element.isBendLine) {
                                    // 절곡선: 투명 호버 영역 + 실제 선
                                    const isActive = hoveredElement === index || selectedElement === index;

                                    return (
                                        <g key={`entity-${index}`} className="bend-group">
                                            {/* 투명 호버 영역 (넓은 영역) */}
                                            <path
                                                d={element.data}
                                                stroke="transparent"
                                                strokeWidth={hoverZoneWidth}
                                                fill="none"
                                                pointerEvents="stroke"
                                                onMouseEnter={() => setHoveredElement(index)}
                                                onMouseLeave={() => setHoveredElement(null)}
                                                onClick={(e) => handleBendLineClick(index, e)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            {/* 실제 보이는 절곡선 */}
                                            <path
                                                d={element.data}
                                                className="bend-line"
                                                pointerEvents="none"
                                                style={{
                                                    strokeWidth: isActive
                                                        ? (3.0 / transform.scale)  // 호버 또는 선택 시 두껍게
                                                        : adjustedStrokeWidth      // 일반 두께
                                                }}
                                            />
                                        </g>
                                    );
                                } else {
                                    // 일반 선
                                    return (
                                        <path
                                            key={`entity-${index}`}
                                            d={element.data}
                                            className="entity-line"
                                            onMouseEnter={() => setHoveredElement(index)}
                                            onMouseLeave={() => setHoveredElement(null)}
                                            style={{
                                                opacity: hoveredElement === index ? 1 : 0.8,
                                                strokeWidth: adjustedStrokeWidth
                                            }}
                                        />
                                    );
                                }
                            } else if (element.type === 'circle') {
                                const diameter = (element.data.r * 2).toFixed(1);
                                const cx = element.data.cx;
                                const cy = element.data.cy;
                                const r = element.data.r;
                                const isHovered = hoveredElement === index;

                                return (
                                    <g key={`entity-${index}`} className="circle-group">
                                        {/* 원 */}
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={r}
                                            className="entity-circle"
                                            onMouseEnter={() => setHoveredElement(index)}
                                            onMouseLeave={() => setHoveredElement(null)}
                                            style={{
                                                opacity: isHovered ? 1 : 0.8,
                                                strokeWidth: isHovered
                                                    ? (2.5 / transform.scale)  // 호버 시 두껍게
                                                    : adjustedStrokeWidth,     // 일반 두께
                                                cursor: 'pointer'
                                            }}
                                        />

                                        {/* 지름 표시 그룹 */}
                                        <g className={`dimension-group ${isHovered ? 'visible' : ''}`}>
                                            {/* 지름 선 (화살표) */}
                                            <line
                                                className="dimension-line"
                                                x1={cx - r}
                                                y1={cy}
                                                x2={cx + r}
                                                y2={cy}
                                                markerStart="url(#arrow-start)"
                                                markerEnd="url(#arrow-end)"
                                                style={{ strokeWidth: 1 / transform.scale }}
                                            />

                                            {/* 레이블 배경 */}
                                            <rect
                                                className="label-bg"
                                                x={cx - 25 / transform.scale}
                                                y={cy - 10 / transform.scale}
                                                width={50 / transform.scale}
                                                height={20 / transform.scale}
                                                rx={4 / transform.scale}
                                                ry={4 / transform.scale}
                                            />

                                            {/* 지름 텍스트 */}
                                            <text
                                                className="label-text"
                                                x={cx}
                                                y={cy}
                                                style={{ fontSize: `${11 / transform.scale}px` }}
                                            >
                                                Ø{diameter}
                                            </text>
                                        </g>
                                    </g>
                                );
                            } else if (element.type === 'group') {
                                return (
                                    <g key={`entity-${index}`} transform={element.transform}>
                                        {element.children.map((child, i) => {
                                            if (!child) return null;
                                            if (child.type === 'path') {
                                                return <path key={i} d={child.data} className="entity-line" strokeWidth={adjustedStrokeWidth} fill="none" />;
                                            } else if (child.type === 'circle') {
                                                return <circle key={i} cx={child.data.cx} cy={child.data.cy} r={child.data.r} className="entity-circle" strokeWidth={adjustedStrokeWidth} fill="none" />;
                                            } else if (child.type === 'text') {
                                                return (
                                                    <text
                                                        key={`entity-${index}-${i}`}
                                                        x={child.data.x}
                                                        y={child.data.y}
                                                        fontSize={child.data.fontSize}
                                                        transform={`rotate(${child.data.rotation}, ${child.data.x}, ${child.data.y}) scale(1, -1)`}
                                                        textAnchor="start"
                                                        fill="black"
                                                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                                                    >
                                                        {child.data.text}
                                                    </text>
                                                );
                                            }
                                            return null;
                                        })}
                                    </g>
                                );
                            } else if (element.type === 'text') {
                                return (
                                    <text
                                        key={`entity-${index}`}
                                        x={element.data.x}
                                        y={element.data.y}
                                        fontSize={element.data.fontSize}
                                        transform={`rotate(${element.data.rotation}, ${element.data.x}, ${element.data.y}) scale(1, -1)`}
                                        textAnchor="start"
                                        fill="black"
                                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                                    >
                                        {element.data.text}
                                    </text>
                                );
                            }
                            return null;
                        })}
                    </g>
                </svg>
            </div>

            <div className="viewer-info">
                <span>엔티티 수: {svgElements.length}</span>
                {bounds && (
                    <span>크기: {bounds.width.toFixed(1)} × {bounds.height.toFixed(1)}</span>
                )}
            </div>
        </div >
    );
};

export default SVGViewer;
