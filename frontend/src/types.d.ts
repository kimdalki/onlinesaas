declare module '*.jsx' {
    const content: React.FC<any>;
    export default content;
}

declare module './utils/dxfParser' {
    const dxfParser: {
        parseDXF: (content: string) => any;
        extractEntities: (parsed: any) => any[];
        calculateBounds: (entities: any[]) => any;
    };
    export default dxfParser;
}

declare module './utils/svgRenderer' {
    const svgRenderer: {
        registerBlocks: (blocks: any) => void;
        registerLayers: (layers: any) => void;
        setupViewport: (bounds: any, width: number, height: number, padding: number) => void;
        entityToSVG: (entity: any) => any;
        generateGrid: (bounds: any, spacing: number, width: number, height: number) => any[];
    };
    export default svgRenderer;
}

declare module '../SVGViewer/SVGViewer' {
    const SVGViewer: React.FC<{
        svgElements: any[];
        gridLines: any[];
        bounds: any;
        fileName: string;
    }>;
    export default SVGViewer;
}
