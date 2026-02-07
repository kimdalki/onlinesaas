import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import UploadCard from './components/Dashboard/UploadCard';
import PartCard from './components/Dashboard/PartCard';
import type { Part } from './types/Part';
import PartReviewModal from './components/Dashboard/PartReviewModal';
import dxfParser from './utils/dxfParser';
import svgRenderer from './utils/svgRenderer';
import './App.css';

interface JobStatus {
  jobId: string;
  uploadId: string;
  status: string;
  progress: number;
  dxfUrl: string | null;
  errorMessage: string | null;
  originalFileName: string | null;
}

function App() {
  const [activeMenu, setActiveMenu] = useState('uncategorized');
  const [activeTab, setActiveTab] = useState('parts');
  const [isUploading, setIsUploading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter parts based on search query
  const filteredParts = parts.filter(part =>
    part.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // SVG Viewer state for modal
  const [svgElements, setSvgElements] = useState<any[]>([]);
  const [gridLines, setGridLines] = useState<any[]>([]);
  const [bounds, setBounds] = useState<any>(null);

  // Polling state
  const [pollingJobs, setPollingJobs] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch stored parts from database on mount
  useEffect(() => {
    const fetchStoredParts = async () => {
      try {
        const response = await fetch('/api/parts');
        if (!response.ok) return;

        const storedParts = await response.json();

        // Convert API response to Part format and load SVG data for ready parts
        const partsWithSvg = await Promise.all(
          storedParts.map(async (p: any) => {
            const part: Part = {
              id: p.id,
              fileName: p.fileName,
              fileType: p.fileType,
              dimensions: p.dimensions,
              status: p.status,
              dxfUrl: p.dxfUrl,
            };

            // Load SVG data for ready parts
            if (p.status === 'ready' && p.dxfUrl) {
              try {
                const dxfResponse = await fetch(p.dxfUrl);
                const fileContent = await dxfResponse.text();

                const parsed = dxfParser.parseDXF(fileContent);
                const entities = dxfParser.extractEntities(parsed);
                const calculatedBounds = dxfParser.calculateBounds(entities);

                if (parsed.blocks) {
                  svgRenderer.registerBlocks(parsed.blocks);
                }
                if (parsed.tables?.layer?.layers) {
                  svgRenderer.registerLayers(parsed.tables.layer.layers);
                }

                svgRenderer.setupViewport(calculatedBounds, 200, 150, 10);
                const elements = entities
                  .map((entity: any) => svgRenderer.entityToSVG(entity))
                  .filter((el: any) => el !== null);

                const width = (calculatedBounds.maxX - calculatedBounds.minX).toFixed(2);
                const height = (calculatedBounds.maxY - calculatedBounds.minY).toFixed(2);

                // Calculate SVG bounds after transformation
                const topLeft = svgRenderer.transformCoordinate(calculatedBounds.minX, calculatedBounds.maxY);
                const bottomRight = svgRenderer.transformCoordinate(calculatedBounds.maxX, calculatedBounds.minY);
                const svgBounds = {
                  minX: Math.min(topLeft.x, bottomRight.x),
                  minY: Math.min(topLeft.y, bottomRight.y),
                  maxX: Math.max(topLeft.x, bottomRight.x),
                  maxY: Math.max(topLeft.y, bottomRight.y),
                };

                return {
                  ...part,
                  dimensions: `${width} × ${height} mm`,
                  svgData: { elements, bounds: svgBounds },
                };
              } catch (err) {
                console.error('Error loading SVG for part:', p.id, err);
                return part;
              }
            }

            return part;
          })
        );

        setParts(partsWithSvg);

        // Resume polling for processing parts
        partsWithSvg.forEach((p: any) => {
          if (p.status === 'processing') {
            startPolling(p.id);
          }
        });
      } catch (error) {
        console.error('Error fetching stored parts:', error);
      }
    };

    fetchStoredParts();
  }, []);

  // Upload file handler
  const handleFileSelect = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '업로드 실패');
      }

      const data = await response.json();

      // Create new part
      const newPart: Part = {
        id: data.jobId,
        fileName: file.name,
        fileType: 'AutoCAD DXF R12',
        dimensions: 'Calculating...',
        status: 'processing',
      };

      setParts(prev => [...prev, newPart]);
      startPolling(data.jobId);

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Start polling for a job
  function startPolling(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) return;

        const status: JobStatus = await response.json();

        if (status.status === 'Succeeded' || status.status === 'Failed') {
          clearInterval(interval);
          setPollingJobs(prev => {
            const newMap = new Map(prev);
            newMap.delete(jobId);
            return newMap;
          });

          // Load and parse DXF for thumbnail if succeeded
          if (status.status === 'Succeeded' && status.dxfUrl) {
            try {
              const dxfResponse = await fetch(status.dxfUrl);
              const fileContent = await dxfResponse.text();

              const parsed = dxfParser.parseDXF(fileContent);
              const entities = dxfParser.extractEntities(parsed);
              const calculatedBounds = dxfParser.calculateBounds(entities);

              if (parsed.blocks) {
                svgRenderer.registerBlocks(parsed.blocks);
              }
              if (parsed.tables?.layer?.layers) {
                svgRenderer.registerLayers(parsed.tables.layer.layers);
              }

              svgRenderer.setupViewport(calculatedBounds, 200, 150, 10);
              const elements = entities
                .map((entity: any) => svgRenderer.entityToSVG(entity))
                .filter((el: any) => el !== null);

              // Calculate dimensions from bounds
              const width = (calculatedBounds.maxX - calculatedBounds.minX).toFixed(2);
              const height = (calculatedBounds.maxY - calculatedBounds.minY).toFixed(2);

              // Calculate SVG bounds after transformation
              const topLeft = svgRenderer.transformCoordinate(calculatedBounds.minX, calculatedBounds.maxY);
              const bottomRight = svgRenderer.transformCoordinate(calculatedBounds.maxX, calculatedBounds.minY);
              const svgBounds = {
                minX: Math.min(topLeft.x, bottomRight.x),
                minY: Math.min(topLeft.y, bottomRight.y),
                maxX: Math.max(topLeft.x, bottomRight.x),
                maxY: Math.max(topLeft.y, bottomRight.y),
              };

              setParts(prev => prev.map(p => {
                if (p.id === jobId) {
                  return {
                    ...p,
                    status: 'ready',
                    dxfUrl: status.dxfUrl || undefined,
                    dimensions: `${width} × ${height} mm`,
                    svgData: {
                      elements,
                      bounds: svgBounds,
                    },
                  };
                }
                return p;
              }));
            } catch (parseError) {
              console.error('DXF parse error:', parseError);
              setParts(prev => prev.map(p => {
                if (p.id === jobId) {
                  return { ...p, status: 'error', dxfUrl: status.dxfUrl || undefined };
                }
                return p;
              }));
            }
          } else {
            // Update part status for failure
            setParts(prev => prev.map(p => {
              if (p.id === jobId) {
                return { ...p, status: 'error' };
              }
              return p;
            }));
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000);

    setPollingJobs(prev => new Map(prev).set(jobId, interval));
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingJobs.forEach(interval => clearInterval(interval));
    };
  }, []);

  // Polling state


  // Selection state
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());

  // Toggle selection of a single part
  const handleSelectPart = (part: Part) => {
    setSelectedPartIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(part.id)) {
        newSet.delete(part.id);
      } else {
        newSet.add(part.id);
      }
      return newSet;
    });
  };

  // Select all parts
  const handleSelectAll = () => {
    const allIds = new Set(parts.map(p => p.id));
    setSelectedPartIds(allIds);
  };

  // Deselect all parts
  const handleDeselectAll = () => {
    setSelectedPartIds(new Set());
  };

  // Delete selected parts
  const handleDeleteSelected = async () => {
    if (confirm(`Are you sure you want to delete ${selectedPartIds.size} items?`)) {
      const idsToDelete = Array.from(selectedPartIds);

      // Optimistic update
      setParts(prev => prev.filter(p => !selectedPartIds.has(p.id)));
      setSelectedPartIds(new Set());

      try {
        await Promise.all(idsToDelete.map(id =>
          fetch(`/api/parts/${id}`, { method: 'DELETE' })
        ));
      } catch (error) {
        console.error('Error deleting parts:', error);
        alert('Failed to delete some parts from the server.');
      }
    }
  };

  // Add selected parts to cart
  const handleAddToCartSelected = () => {
    setCartCount(prev => prev + selectedPartIds.size);
    handleDeselectAll();
    alert(`${selectedPartIds.size} items added to cart!`);
  };

  // Individual delete handler
  const handleDeletePart = async (part: Part) => {
    if (confirm(`Delete ${part.fileName}?`)) {
      // Optimistic update
      setParts(prev => prev.filter(p => p.id !== part.id));

      if (selectedPartIds.has(part.id)) {
        setSelectedPartIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(part.id);
          return newSet;
        });
      }

      try {
        const response = await fetch(`/api/parts/${part.id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Failed to delete part from server.');
      }
    }
  };

  // View part handler
  const handleViewPart = async (part: Part) => {
    setSelectedPart(part);

    if (part.dxfUrl) {
      await loadAndRenderDxf(part.dxfUrl);
    } else {
      setSvgElements([]);
      setGridLines([]);
      setBounds(null);
    }
  };

  // Load and render DXF file
  const loadAndRenderDxf = async (dxfUrl: string) => {
    try {
      const response = await fetch(dxfUrl);
      const fileContent = await response.text();

      const parsed = dxfParser.parseDXF(fileContent);
      const entities = dxfParser.extractEntities(parsed);

      if (entities.length === 0) {
        throw new Error('DXF 파일에 표시할 엔티티가 없습니다.');
      }

      const calculatedBounds = dxfParser.calculateBounds(entities);

      if (parsed.blocks) {
        svgRenderer.registerBlocks(parsed.blocks);
      }
      if (parsed.tables?.layer?.layers) {
        svgRenderer.registerLayers(parsed.tables.layer.layers);
      }

      svgRenderer.setupViewport(calculatedBounds, 800, 600, 50);
      const elements = entities
        .map((entity: any) => svgRenderer.entityToSVG(entity))
        .filter((el: any) => el !== null);
      const grid = svgRenderer.generateGrid(calculatedBounds, 10, 800, 600);

      setSvgElements(elements);
      setGridLines(grid);
      setBounds(calculatedBounds);
    } catch (error: any) {
      console.error('DXF render error:', error);
    }
  };


  // Add to cart handler
  const handleAddToCart = (part: Part) => {
    setCartCount(prev => prev + 1);
  };



  // Confirm part handler
  const handleConfirmPart = (part: Part) => {
    setSelectedPart(null);
    handleAddToCart(part);
  };

  return (
    <div className="app-container">
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="main-content">
        <Topbar
          title="Pangeum"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          cartCount={cartCount}
          selectedCount={selectedPartIds.size}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onDeleteSelected={handleDeleteSelected}
          onAddToCartSelected={handleAddToCartSelected}
        />

        <div className="content-area">
          {activeTab === 'parts' && (
            <div className="parts-gallery">
              <UploadCard onFileSelect={handleFileSelect} isUploading={isUploading} />

              {filteredParts.map(part => (
                <PartCard
                  key={part.id}
                  part={part}
                  isSelected={selectedPartIds.has(part.id)}
                  onView={() => handleViewPart(part)}
                  onSelect={handleSelectPart}
                  onAddToCart={handleAddToCart}
                  onDelete={handleDeletePart}
                />
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="placeholder-content">
              <h2>Orders</h2>
              <p>No orders yet.</p>
            </div>
          )}

          {activeTab === 'saved-carts' && (
            <div className="placeholder-content">
              <h2>Saved Carts</h2>
              <p>No saved carts.</p>
            </div>
          )}
        </div>
      </main>

      {selectedPart && (
        <PartReviewModal
          part={selectedPart}
          svgElements={svgElements}
          gridLines={gridLines}
          bounds={bounds}
          onClose={() => setSelectedPart(null)}
          onConfirm={handleConfirmPart}
        />
      )}
    </div>
  );
}

export default App;
