import DxfParser from 'dxf-parser';

/**
 * DXF 파일을 파싱하고 구조화된 데이터로 변환
 */
export class DXFParserUtil {
  constructor() {
    this.parser = new DxfParser();
  }

  /**
   * DXF 파일 내용을 파싱
   * @param {string} fileContent - DXF 파일의 텍스트 내용
   * @returns {Object} 파싱된 DXF 데이터
   */
  parseDXF(fileContent) {
    try {
      const dxf = this.parser.parseSync(fileContent);
      return dxf;
    } catch (error) {
      console.error('DXF 파싱 오류:', error);
      throw new Error(`DXF 파일을 파싱할 수 없습니다: ${error.message}`);
    }
  }

  /**
   * DXF에서 엔티티 추출 (LINE, CIRCLE, ARC, POLYLINE 등)
   * @param {Object} parsedDXF - 파싱된 DXF 객체
   * @returns {Array} 엔티티 배열
   */
  extractEntities(parsedDXF) {
    if (!parsedDXF || !parsedDXF.entities) {
      console.warn('파싱된 DXF에 엔티티가 없습니다');
      return [];
    }

    // console.log('전체 엔티티 수:', parsedDXF.entities.length);
    // console.log('첫 번째 엔티티 샘플:', parsedDXF.entities[0]);

    // 색상 정보 확인 - 디버깅용이므로 주석 처리
    /*
    const colorInfo = parsedDXF.entities.map(e => ({
      type: e.type,
      color: e.color,
      colorIndex: e.colorIndex,
      layer: e.layer
    }));
    console.log('엔티티 색상 정보:', colorInfo);
    */

    return parsedDXF.entities;
  }

  /**
   * 절곡선 자동 인식 (마젠타 색상 + 실선/히든 감지)
   * @param {Array} entities - DXF 엔티티 배열
   * @returns {Array} 절곡선으로 판단되는 엔티티
   */
  extractBendLines(entities) {
    const bendLines = entities.filter(entity => {
      // LINE, LWPOLYLINE, POLYLINE 타입에서 절곡선 판단
      if (entity.type === 'LINE' || entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        const layerName = entity.layer?.toLowerCase() || '';
        const lineType = entity.lineType?.toLowerCase() || '';
        const colorIndex = entity.colorIndex || entity.color;

        // 마젠타 색상(color index 6)이면서 실선 또는 히든 선인 경우
        const isMagenta = colorIndex === 6;
        const isContinuousOrHidden = lineType.includes('continuous') ||
          lineType.includes('hidden') ||
          lineType.includes('bylayer') ||
          !lineType;  // 선 타입이 없으면 기본(실선)

        if (isMagenta && isContinuousOrHidden) {
          console.log('절곡선 감지 (마젠타):', {
            type: entity.type,
            colorIndex,
            lineType,
            layer: entity.layer
          });
          return true;
        }

        // 또는 레이어 이름에 'BEND' 또는 '절곡' 포함
        if (layerName.includes('bend') || layerName.includes('절곡')) {
          console.log('절곡선 감지 (레이어명):', { layer: entity.layer });
          return true;
        }
      }
      return false;
    });

    console.log('총 절곡선 수:', bendLines.length);
    return bendLines;
  }

  /**
   * 도면 경계 계산 (뷰포트 설정용)
   * @param {Array} entities - DXF 엔티티 배열
   * @returns {Object} { minX, minY, maxX, maxY, width, height }
   */
  calculateBounds(entities) {
    if (!entities || entities.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    entities.forEach(entity => {
      const points = this.getEntityPoints(entity);
      points.forEach(point => {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
      });
    });

    // 유효하지 않은 경계인 경우 기본값 반환
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * 엔티티에서 좌표 추출
   * @param {Object} entity - DXF 엔티티
   * @returns {Array} 좌표 배열
   */
  getEntityPoints(entity) {
    const points = [];

    try {
      switch (entity.type) {
        case 'LINE':
          if (entity.vertices && entity.vertices.length >= 2) {
            points.push(
              { x: entity.vertices[0].x, y: entity.vertices[0].y },
              { x: entity.vertices[1].x, y: entity.vertices[1].y }
            );
          } else if (entity.start && entity.end) {
            points.push(
              { x: entity.start.x, y: entity.start.y },
              { x: entity.end.x, y: entity.end.y }
            );
          }
          break;

        case 'CIRCLE':
          if (entity.center && entity.radius) {
            points.push(
              { x: entity.center.x - entity.radius, y: entity.center.y - entity.radius },
              { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius }
            );
          }
          break;

        case 'ARC':
          if (entity.center && entity.radius) {
            let startX = entity.center.x - entity.radius;
            let endX = entity.center.x + entity.radius;
            // Extrusion Z가 -1이면 X좌표 반전 (Min/Max 계산을 위해 양쪽 다 고려해야 하지만, 
            // 여기서는 단순 경계면 충분하므로 반전된 중심 기준으로 반경만큼 확장)

            if (entity.extrusion && entity.extrusion.z === -1) {
              // 중심점 X 반전
              const centerX = -entity.center.x;
              points.push(
                { x: centerX - entity.radius, y: entity.center.y - entity.radius },
                { x: centerX + entity.radius, y: entity.center.y + entity.radius }
              );
            } else {
              points.push(
                { x: entity.center.x - entity.radius, y: entity.center.y - entity.radius },
                { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius }
              );
            }
          }
          break;

        case 'LWPOLYLINE':
        case 'POLYLINE':
          if (entity.vertices && Array.isArray(entity.vertices)) {
            entity.vertices.forEach(vertex => {
              points.push({ x: vertex.x, y: vertex.y });
            });
          }
          break;

        case 'SPLINE':
          if (entity.controlPoints && Array.isArray(entity.controlPoints)) {
            entity.controlPoints.forEach(point => {
              points.push({ x: point.x, y: point.y });
            });
          }
          break;

        case 'ELLIPSE':
          if (entity.center && entity.majorAxis) {
            // 타원의 대략적인 경계 계산 (정확하진 않지만 뷰포트 설정용으로는 충분)
            const majorLen = Math.sqrt(entity.majorAxis.x ** 2 + entity.majorAxis.y ** 2);
            const minorLen = majorLen * (entity.axisRatio || 1);
            const maxRadius = Math.max(majorLen, minorLen);

            points.push(
              { x: entity.center.x - maxRadius, y: entity.center.y - maxRadius },
              { x: entity.center.x + maxRadius, y: entity.center.y + maxRadius }
            );
          }
          break;

        default:
          if (entity.vertices && Array.isArray(entity.vertices)) {
            entity.vertices.forEach(vertex => {
              points.push({ x: vertex.x, y: vertex.y });
            });
          }
      }
    } catch (err) {
      console.error('엔티티 포인트 추출 오류:', entity.type, err);
    }

    return points;
  }

  /**
   * 치수 엔티티 추출
   * @param {Array} entities - DXF 엔티티 배열
   * @returns {Array} 치수 엔티티 배열
   */
  extractDimensions(entities) {
    return entities.filter(entity =>
      entity.type && entity.type.includes('DIMENSION')
    );
  }
}

export default new DXFParserUtil();
