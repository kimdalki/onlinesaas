/**
 * DXF 엔티티를 SVG 요소로 변환하는 렌더러
 */
export class SVGRenderer {
    constructor() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.blocks = {}; // 블록 정의 저장용
        this.layers = {}; // 레이어 정의 저장용
    }

    /**
     * 블록 정의 등록
     * @param {Object} blocks - DXF 블록 정의 객체
     */
    registerBlocks(blocks) {
        this.blocks = blocks || {};
    }

    /**
     * 레이어 정의 등록
     * @param {Object} layers - DXF 레이어 정의 객체
     */
    registerLayers(layers) {
        this.layers = layers || {};
    }

    /**
     * DXF 좌표를 SVG 좌표로 변환
     * @param {number} x - DXF X 좌표
     * @param {number} y - DXF Y 좌표
     * @returns {Object} { x, y } SVG 좌표
     */
    transformCoordinate(x, y) {
        // DXF 좌표를 SVG 좌표로 변환 (중앙 정렬)
        const svgX = (x - this.offsetX) * this.scale;
        const svgY = (this.offsetY - y) * this.scale;  // Y축 반전 (DXF는 위로, SVG는 아래로)

        return { x: svgX, y: svgY };
    }

    /**
     * 뷰포트 설정 (bounds에 맞게 스케일 조정)
     * @param {Object} bounds - { minX, minY, maxX, maxY, width, height }
     * @param {number} viewportWidth - SVG 뷰포트 너비
     * @param {number} viewportHeight - SVG 뷰포트 높이
     * @param {number} padding - 여백 (픽셀)
     */
    setupViewport(bounds, viewportWidth, viewportHeight, padding = 50) {
        const scaleX = (viewportWidth - padding * 2) / bounds.width;
        const scaleY = (viewportHeight - padding * 2) / bounds.height;

        // 작은 스케일을 사용하여 전체가 보이도록
        this.scale = Math.min(scaleX, scaleY);

        // 중앙 정렬을 위한 오프셋 계산
        this.offsetX = bounds.minX - (viewportWidth / this.scale - bounds.width) / 2;
        this.offsetY = bounds.maxY + (viewportHeight / this.scale - bounds.height) / 2;  // Y축 반전 고려

        console.log('뷰포트 설정:', {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            bounds,
            viewportWidth,
            viewportHeight
        });
    }

    /**
     * LINE 엔티티를 SVG path로 변환
     * @param {Object} entity - DXF LINE 엔티티
     * @returns {string} SVG path d 속성
     */
    lineToPath(entity) {
        let start, end;

        // dxf-parser는 start/end 또는 vertices 형식 사용
        if (entity.vertices && entity.vertices.length >= 2) {
            start = this.transformCoordinate(entity.vertices[0].x, entity.vertices[0].y);
            end = this.transformCoordinate(entity.vertices[1].x, entity.vertices[1].y);
        } else if (entity.start && entity.end) {
            start = this.transformCoordinate(entity.start.x, entity.start.y);
            end = this.transformCoordinate(entity.end.x, entity.end.y);
        } else {
            console.warn('LINE 엔티티에 좌표 정보가 없습니다:', entity);
            return '';
        }

        const path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        console.log('생성된 SVG path:', path, '원본:', entity.start || entity.vertices);

        return path;
    }

    /**
     * CIRCLE 엔티티를 SVG circle로 변환
     * @param {Object} entity - DXF CIRCLE 엔티티
     * @returns {Object} { cx, cy, r }
     */
    circleToSVG(entity) {
        const center = this.transformCoordinate(entity.center.x, entity.center.y);
        return {
            cx: center.x,
            cy: center.y,
            r: entity.radius * this.scale
        };
    }

    /**
     * Arbitrary Axis Algorithm을 사용하여 OCS 변환 행렬 계산
     * @param {Object} extrusion - Extrusion 벡터 (Nx, Ny, Nz)
     * @returns {Object} { Ax, Ay, Az } - 변환 행렬의 축 벡터들
     */
    getArbitraryAxis(extrusion) {
        if (!extrusion) {
            // 기본값: WCS와 동일
            return {
                Ax: { x: 1, y: 0, z: 0 },
                Ay: { x: 0, y: 1, z: 0 },
                Az: { x: 0, y: 0, z: 1 }
            };
        }

        const N = { x: extrusion.x, y: extrusion.y, z: extrusion.z };
        const Ax = {};
        const Ay = {};

        // AutoCAD Arbitrary Axis Algorithm
        // N의 x와 y 크기가 모두 1/64보다 작으면
        if (Math.abs(N.x) < 1.0 / 64.0 && Math.abs(N.y) < 1.0 / 64.0) {
            // Ax = Wy x N (Wy = 0,1,0)
            Ax.x = 0 * N.z - 1 * N.y; // 0 - Ny
            Ax.y = 1 * N.x - 0 * N.z; // Nx - 0
            Ax.z = 0 * N.y - 1 * N.x; // 0 - Nx (Wy_z=0) -> Cross Product: (0,1,0)x(Nx,Ny,Nz) = (Nz, 0, -Nx)? 
            // Cross product: (uy*vz - uz*vy, uz*vx - ux*vz, ux*vy - uy*vx)
            // (1*Nz - 0*Ny, 0*Nx - 0*Nz, 0*Ny - 1*Nx) = (Nz, 0, -Nx)
            Ax.x = N.z;
            Ax.y = 0;
            Ax.z = -N.x;
        } else {
            // Ax = Wz x N (Wz = 0,0,1)
            // (0,0,1)x(Nx,Ny,Nz) = (0*Nz - 1*Ny, 1*Nx - 0*Nz, 0*Ny - 0*Nx) = (-Ny, Nx, 0)
            Ax.x = -N.y;
            Ax.y = N.x;
            Ax.z = 0;
        }

        // Normalize Ax
        const dAx = Math.sqrt(Ax.x * Ax.x + Ax.y * Ax.y + Ax.z * Ax.z);
        Ax.x /= dAx;
        Ax.y /= dAx;
        Ax.z /= dAx;

        // Ay = N x Ax
        Ay.x = N.y * Ax.z - N.z * Ax.y;
        Ay.y = N.z * Ax.x - N.x * Ax.z;
        Ay.z = N.x * Ax.y - N.y * Ax.x;

        // Normalize Ay (이론상 이미 단위벡터여야 하지만 안전을 위해)
        const dAy = Math.sqrt(Ay.x * Ay.x + Ay.y * Ay.y + Ay.z * Ay.z);
        Ay.x /= dAy;
        Ay.y /= dAy;
        Ay.z /= dAy;

        return { Ax, Ay, Az: N };
    }

    /**
     * OCS 좌표를 WCS 좌표로 변환
     * @param {number} x - OCS x
     * @param {number} y - OCS y
     * @param {number} z - OCS z (또는 elevation)
     * @param {Object} extrusion - Extrusion 벡터
     * @returns {Object} { x, y, z } WCS 좌표
     */
    applyOCS(x, y, z, extrusion) {
        if (!extrusion) return { x, y, z };

        const { Ax, Ay, Az } = this.getArbitraryAxis(extrusion);

        // P_wcs = x * Ax + y * Ay + z * Az
        return {
            x: x * Ax.x + y * Ay.x + z * Az.x,
            y: x * Ax.y + y * Ay.y + z * Az.y,
            z: x * Ax.z + y * Ay.z + z * Az.z
        };
    }

    /**
     * ARC 엔티티를 SVG path로 변환
     * @param {Object} entity - DXF ARC 엔티티
     * @returns {string} SVG path d 속성
     */
    arcToPath(entity) {
        // 1. 각도 사용 (dxf-parser가 이미 라디안으로 반환하는 것으로 확인됨)
        // 로그상의 4.712...(3pi/2) 값으로 보아 라디안임. 불필요한 변환 제거.
        const startAngle = entity.startAngle;
        const endAngle = entity.endAngle;

        // 2. OCS 좌표계 상의 시작점과 끝점 계산
        // entity.center는 이미 OCS 좌표입니다.
        const ocsStartX = entity.center.x + entity.radius * Math.cos(startAngle);
        const ocsStartY = entity.center.y + entity.radius * Math.sin(startAngle);
        const ocsEndX = entity.center.x + entity.radius * Math.cos(endAngle);
        const ocsEndY = entity.center.y + entity.radius * Math.sin(endAngle);
        const z = entity.center.z || 0; // OCS Z좌표 (elevation)

        // 3. OCS -> WCS 변환 (Arbitrary Axis Algorithm 적용)
        // Extrusion이 없으면 applyOCS는 입력값을 그대로 반환합니다.
        const wcsStart = this.applyOCS(ocsStartX, ocsStartY, z, entity.extrusion);
        const wcsEnd = this.applyOCS(ocsEndX, ocsEndY, z, entity.extrusion);

        // 4. SVG Viewport 좌표계로 변환 (WCS -> SVG)
        const start = this.transformCoordinate(wcsStart.x, wcsStart.y);
        const end = this.transformCoordinate(wcsEnd.x, wcsEnd.y);

        console.log('ARC 변환 정보:', {
            r: entity.radius,
            angles: { start: entity.startAngle, end: entity.endAngle },
            ocs: { start: { x: ocsStartX, y: ocsStartY }, end: { x: ocsEndX, y: ocsEndY } },
            wcs: { start: wcsStart, end: wcsEnd },
            svg: { start, end },
            extrusion: entity.extrusion
        });

        // 5. Large Arc Flag 계산
        let deltaAngle = endAngle - startAngle;
        if (deltaAngle < 0) deltaAngle += 2 * Math.PI;
        const largeArcFlag = deltaAngle > Math.PI ? 1 : 0;

        // 6. Sweep Flag 계산
        // 기본적으로 DXF는 CCW(반시계) 방향이 양수입니다.
        // SVG 좌표계는 Y축이 아래로 내려가므로 Y축 반전이 일어납니다.
        // 따라서 일반적인 경우 DXF CCW -> SVG CW가 되어 sweepFlag=0이 맞습니다. (상단 Y반전 로직에 따름)
        // 하지만 Extrusion Z가 -1(뒤집힘)인 경우, OCS 평면 자체가 뒤집혀 있으므로 그리기 방향도 반대가 됩니다.
        // 따라서 Z < 0 이면 sweepFlag를 1로 설정하여 호가 올바른 방향으로 그려지게 합니다.
        let sweepFlag = 0;
        if (entity.extrusion && entity.extrusion.z < 0) {
            sweepFlag = 1;
        }

        const radius = entity.radius * this.scale;
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
    }

    /**
     * POLYLINE 엔티티를 SVG path로 변환
     * @param {Object} entity - DXF POLYLINE 엔티티
     * @returns {string} SVG path d 속성
     */
    polylineToPath(entity) {
        if (!entity.vertices || entity.vertices.length === 0) {
            return '';
        }

        const points = entity.vertices.map(v => this.transformCoordinate(v.x, v.y));
        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }

        // 닫힌 폴리라인인 경우 (플래그 확인 또는 시작점=끝점 확인)
        const isClosedFlag = entity.shape || entity.closed || false;

        // 시작점과 끝점이 같은지 확인 (오차 범위 고려)
        const start = points[0];
        const end = points[points.length - 1];
        const isGeometricallyClosed = Math.abs(start.x - end.x) < 0.001 && Math.abs(start.y - end.y) < 0.001;

        if (isClosedFlag || isGeometricallyClosed) {
            path += ' Z';
        }

        return path;
    }

    /**
     * B-Spline 곡선 계산 (De Boor's Algorithm or Approximation)
     * 여기서는 Control Points를 이용한 간단한 Catmull-Rom 또는 Bezier 근사 대신
     * DXF Spline의 Degree와 Knots를 고려해야 정확하지만, 
     * 판금용 뷰어 목적상 Control Points를 부드럽게 연결하는 것으로 근사합니다.
     * (정확한 B-Spline 구현은 매우 복잡하므로 1차적으로 Polyline 근사로 구현)
     */
    splineToPath(entity) {
        if (!entity.controlPoints || entity.controlPoints.length === 0) return '';

        // TODO: 추후 정확한 B-Spline 보간(Interpolation) 로직 적용 필요
        // 현재는 Control Point들을 부드러운 곡선(Bezier)으로 연결하는 방식 사용

        const points = entity.controlPoints.map(p => this.transformCoordinate(p.x, p.y));
        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        // Control Point들을 단순히 연결 (Polyline) - 가장 안전한 방법
        // Catmull-Rom 등은 Control Point를 지나치지 않을 수 있음 (DXF Spline은 보통 근사하지 않음)
        // DXF Spline은 Control Point를 '통과'하는게 아니라 '조절점'으로 사용함.
        // 따라서 정확히 그리려면 Polyline으로 근사하거나 Curve 라이브러리 필요.
        // 우선은 Control Points를 잇는 부드러운 곡선(Catmull-Rom)으로 시도해봅니다.

        for (let i = 0; i < points.length - 1; i++) {
            // 단순 직선 연결 (가장 정확한 형상 파악을 위해 1단계로 적용)
            path += ` L ${points[i + 1].x} ${points[i + 1].y}`;
        }

        return path;
    }

    /**
     * ELLIPSE 엔티티를 SVG path로 변환
     * @param {Object} entity 
     * @returns {string} SVG path d 속성
     */
    ellipseToPath(entity) {
        if (!entity.center || !entity.majorAxis) return '';

        const center = entity.center;
        const majorAxis = entity.majorAxis;
        const ratio = entity.axisRatio || 1;
        const startParam = entity.startAngle || 0; // 라디안
        const endParam = entity.endAngle || (2 * Math.PI); // 라디안

        // Major Axis Length & Angle
        const majorR = Math.sqrt(majorAxis.x ** 2 + majorAxis.y ** 2);
        const minorR = majorR * ratio;
        const rotation = Math.atan2(majorAxis.y, majorAxis.x); // 라디안

        // 파라메트릭 방정식으로 점 샘플링 (정확한 호 표현을 위해)
        // SVG의 A 커맨드는 회전된 타원의 부분 호를 표현하기 까다로울 수 있음 (특히 시작/끝 각도 처리)
        // 안전하게 폴리라인으로 근사하거나, 완전한 타원인 경우 ellipse 태그 사용

        const isFullEllipse = Math.abs(endParam - startParam) >= 2 * Math.PI - 0.01;

        if (isFullEllipse) {
            const cx = center.x;
            const cy = center.y;

            // 회전 변환 적용이 필요하므로 Path로 그리는게 안전함
            // (SVG ellipse 태그는 transform rotate를 써야해서 좌표계가 꼬일 수 있음)
        }

        // 샘플링을 통한 Path 생성 (가장 확실한 방법)
        const segments = 64; // 해상도
        let path = '';

        let validStartParam = startParam;
        let validEndParam = endParam;
        if (validEndParam < validStartParam) validEndParam += 2 * Math.PI;

        for (let i = 0; i <= segments; i++) {
            const t = validStartParam + (validEndParam - validStartParam) * (i / segments);

            // 타원 방정식 (Rotated)
            const x = center.x + majorR * Math.cos(t) * Math.cos(rotation) - minorR * Math.sin(t) * Math.sin(rotation);
            const y = center.y + majorR * Math.cos(t) * Math.sin(rotation) + minorR * Math.sin(t) * Math.cos(rotation);

            const svgPoint = this.transformCoordinate(x, y);

            if (i === 0) {
                path += `M ${svgPoint.x} ${svgPoint.y}`;
            } else {
                path += ` L ${svgPoint.x} ${svgPoint.y}`;
            }
        }

        return path;
    }

    /**
     * HATCH 엔티티를 SVG path로 변환 (외곽선만 추출)
     */
    hatchToPath(entity) {
        return '';
    }

    /**
     * 블록(INSERT) 렌더링 (재귀적)
     */
    renderBlock(entity) {
        const blockName = entity.name;
        const block = this.blocks[blockName];

        if (!block || !block.entities) return null;

        // 간단한 구현: 블록 내부 엔티티를 현재 위치에 그림
        const children = block.entities.map((child) => {
            return this.entityToSVG(child);
        }).filter(Boolean);

        return {
            type: 'group',
            children: children,
            isBendLine: false,
            layer: entity.layer,
            transform: `translate(${entity.position.x}, ${entity.position.y})`
        };
    }

    /**
     * TEXT/MTEXT 엔티티를 SVG text로 변환
     */
    textToSVG(entity) {
        const x = entity.position ? entity.position.x : 0;
        const y = entity.position ? entity.position.y : 0;
        const text = entity.text || entity.string || '';
        const height = entity.height || 12;
        const rotation = entity.rotation || 0;

        const svgPos = this.transformCoordinate(x, y);

        return {
            x: svgPos.x,
            y: svgPos.y,
            text: text,
            fontSize: height * this.scale,
            rotation: -rotation
        };
    }

    /**
     * 엔티티를 SVG 요소로 변환
     * @param {Object} entity - DXF 엔티티
     * @returns {Object} { type, data, isBendLine }
     */
    entityToSVG(entity) {
        const layerName = entity.layer || '';
        const lineType = entity.lineType?.toLowerCase() || '';
        let colorIndex = entity.colorIndex || entity.color;

        // ByLayer 색상 처리 (Color Index 256)
        // entity.color가 없거나 0, 256인 경우 레이어 색상을 따름
        if (colorIndex === 256 || colorIndex === 0 || colorIndex === undefined) {
            if (this.layers && this.layers[layerName]) {
                colorIndex = this.layers[layerName].color;
            }
        }

        // 절곡선 판단 로직 개선
        // 요구사항: 1. 색상이 마젠타(6) 2. 레이어 색상이 마젠타(6) 
        // 3. 레이어 이름에 'bend', '절곡', 'magenta' 포함
        // (단, 실선/히든선 조건은 유지 - 보통 절곡선은 실선 아님 히든선임)

        let isBendLine = false;

        // 마젠타 색상(color index 6) 확인 (이미 ByLayer 해석됨)
        const isMagenta = colorIndex === 6;

        const isContinuousOrHidden = lineType.includes('continuous') ||
            lineType.includes('hidden') ||
            lineType.includes('bylayer') ||
            !lineType;

        if (isMagenta && isContinuousOrHidden) {
            isBendLine = true;
        }

        // 레이어 이름 확인
        const lowerLayerName = layerName.toLowerCase();
        if (lowerLayerName.includes('bend') ||
            lowerLayerName.includes('절곡') ||
            lowerLayerName.includes('magenta')) {
            isBendLine = true;
        }

        switch (entity.type) {
            case 'LINE':
                return {
                    type: 'path',
                    data: this.lineToPath(entity),
                    isBendLine,
                    layer: entity.layer
                };

            case 'CIRCLE':
                return {
                    type: 'circle',
                    data: this.circleToSVG(entity),
                    isBendLine: false,
                    layer: entity.layer
                };

            case 'ARC':
                return {
                    type: 'path',
                    data: this.arcToPath(entity),
                    isBendLine,  // ARC도 마젠타면 절곡선
                    layer: entity.layer
                };

            case 'LWPOLYLINE':
            case 'POLYLINE':
                return {
                    type: 'path',
                    data: this.polylineToPath(entity),
                    isBendLine,  // POLYLINE도 마젠타면 절곡선!
                    layer: entity.layer
                };

            case 'SPLINE':
                return {
                    type: 'path',
                    data: this.splineToPath(entity),
                    isBendLine, // SPLINE도 절곡선일 수 있음
                    layer: entity.layer
                };

            case 'ELLIPSE':
                return {
                    type: 'path',
                    data: this.ellipseToPath(entity),
                    isBendLine,
                    layer: entity.layer
                };

            case 'INSERT':
                return this.renderBlock(entity);

            case 'HATCH':
                return { type: 'path', data: this.hatchToPath(entity), isBendLine, layer: entity.layer };

            case 'TEXT':
            case 'MTEXT':
                return { type: 'text', data: this.textToSVG(entity), isBendLine: false, layer: entity.layer };

            default:
                return null;
        }
    }

    /**
     * 그리드 라인 생성
     * @param {Object} bounds - 도면 경계
     * @param {number} spacing - 그리드 간격 (DXF 단위)
     * @param {number} viewportWidth - SVG 뷰포트 너비
     * @param {number} viewportHeight - SVG 뷰포트 높이
     * @returns {Array} 그리드 라인 배열
     */
    generateGrid(bounds, spacing = 10, viewportWidth = 800, viewportHeight = 600) {
        const lines = [];
        const majorSpacing = spacing * 5;

        // 수직선
        for (let x = Math.floor(bounds.minX / spacing) * spacing; x <= bounds.maxX; x += spacing) {
            const isMajor = Math.abs(x % majorSpacing) < 0.01;
            const start = this.transformCoordinate(x, bounds.minY);
            const end = this.transformCoordinate(x, bounds.maxY);

            lines.push({
                type: 'line',
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                isMajor
            });
        }

        // 수평선
        for (let y = Math.floor(bounds.minY / spacing) * spacing; y <= bounds.maxY; y += spacing) {
            const isMajor = Math.abs(y % majorSpacing) < 0.01;
            const start = this.transformCoordinate(bounds.minX, y);
            const end = this.transformCoordinate(bounds.maxX, y);

            lines.push({
                type: 'line',
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                isMajor
            });
        }

        return lines;
    }
}

export default new SVGRenderer();
