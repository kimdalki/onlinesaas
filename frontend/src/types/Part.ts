export interface Part {
    id: string;
    fileName: string;
    fileType: string;
    dimensions: string;
    thumbnailUrl?: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    dxfUrl?: string;
    svgData?: {
        elements: any[];
        bounds: any;
    };
}
