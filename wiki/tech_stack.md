# Project Technology Stack

## Backend
- **Framework**: .NET 8 (ASP.NET Core Web API)
- **Database**: SQLite (via Entity Framework Core)
- **ORM**: Entity Framework Core 8.0.0
- **Background Jobs**: Hangfire 1.8.6 (using SQLite Storage) for asynchronous DXF processing
- **API Documentation**: Swagger / OpenAPI (Swashbuckle 6.6.2)

## Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7.2.4
- **Language**: TypeScript 5.9.3
- **Styling**: Standard CSS (Modular CSS approach)
- **CAD Parsing**: `dxf-parser` 1.1.2 (Client-side parsing)
- **Rendering**: Custom SVG Rendering Engine (`svgRenderer.js`) - No external heavy graphics libraries
- **File Upload**: `react-dropzone` 14.4.0

## Architecture
- **Client-Server Communication**: REST API
- **Asynchronous Processing**: Polling pattern for job status (File Upload -> JobId -> Poll Status -> Fetch Result)
- **State Management**: React `useState` / `useEffect` (Lifting State Up pattern)
- **Component Design**: Functional Components with Hooks
