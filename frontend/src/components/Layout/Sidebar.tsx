import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface Folder {
  id: string;
  name: string;
  count: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuChange, searchQuery, onSearchChange }) => {
  const [expandedFolders, setExpandedFolders] = useState(true);

  const folders: Folder[] = [
    { id: 'uncategorized', name: 'Uncategorized', count: 21 },
    { id: 'quote1', name: 'Quote1', count: 0 },
  ];

  const bottomLinks = [
    { id: 'custom-quote', label: 'CUSTOM QUOTE' },
    { id: 'design-guidelines', label: 'DESIGN GUIDELINES' },
    { id: 'tube-profiles', label: 'TUBE PROFILES' },
    { id: 'material-guide', label: 'MATERIAL SELECTION GUIDE' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h2 className="sidebar-title">Parts</h2>

        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="folder-section">
          <button
            className="folder-header"
            onClick={() => setExpandedFolders(!expandedFolders)}
          >
            <svg className={`expand-icon ${expandedFolders ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Folders</span>
          </button>

          {expandedFolders && (
            <ul className="folder-list">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <button
                    className={`folder-item ${activeMenu === folder.id ? 'active' : ''}`}
                    onClick={() => onMenuChange(folder.id)}
                  >
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">({folder.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="view-all-btn">
          VIEW ALL DRAWINGS (23)
        </button>
      </div>

      <div className="sidebar-footer">
        {bottomLinks.map((link) => (
          <a key={link.id} href="#" className="footer-link">
            {link.label}
          </a>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
