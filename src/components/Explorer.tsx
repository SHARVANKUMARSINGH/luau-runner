import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faChevronDown, 
  faCube, 
  faFolder, 
  faFolderOpen, 
  faCode, 
  faServer, 
  faDesktop, 
  faPuzzlePiece,
  faGlobe, 
  faStar, 
  faCog, 
  faCamera, 
  faLightbulb, 
  faMountain,
  faUsers, 
  faBolt, 
  faVolumeHigh, 
  faKeyboard, 
  faWandMagicSparkles,
  faSitemap, 
  faBoxOpen, 
  faWrench,
  faXmark,
  faRotateRight,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import type { ExplorerNode } from '../types';
import './Explorer.css';

interface ExplorerProps {
  tree: ExplorerNode | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  isDark: boolean;
}

const CLASS_ICONS: Record<string, typeof faCube> = {
  DataModel: faGlobe,
  Workspace: faGlobe,
  Players: faUsers,
  ReplicatedStorage: faBoxOpen,
  ServerStorage: faServer,
  ServerScriptService: faCog,
  StarterPlayer: faStar,
  StarterGui: faDesktop,
  StarterPack: faWrench,
  Lighting: faLightbulb,
  SoundService: faVolumeHigh,
  RunService: faBolt,
  UserInputService: faKeyboard,
  TweenService: faWandMagicSparkles,
  Script: faCode,
  LocalScript: faDesktop,
  ModuleScript: faPuzzlePiece,
  Part: faCube,
  MeshPart: faCube,
  WedgePart: faCube,
  SpawnLocation: faCube,
  Model: faSitemap,
  Folder: faFolder,
  Camera: faCamera,
  Terrain: faMountain,
  RemoteEvent: faBolt,
  RemoteFunction: faBolt,
  BindableEvent: faBolt,
  BindableFunction: faBolt,
  ScreenGui: faDesktop,
  Frame: faDesktop,
  TextLabel: faDesktop,
  TextButton: faDesktop,
  TextBox: faDesktop,
  ImageLabel: faDesktop,
  ImageButton: faDesktop,
  Player: faUsers,
  Sound: faVolumeHigh,
  Tool: faWrench,
};

interface TreeNodeProps {
  node: ExplorerNode;
  depth: number;
  isDark: boolean;
  selectedPath: string | null;
  onSelect: (node: ExplorerNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  depth, 
  isDark, 
  selectedPath, 
  onSelect 
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;
  const icon = CLASS_ICONS[node.className] || faCube;

  const handleRowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  }, [node, onSelect]);

  const handleExpandToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
  }, [hasChildren]);

  return (
    <div className="tree-node">
      <div 
        className={`tree-node-row ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={handleRowClick}
      >
        <span className="tree-expand-icon" onClick={handleExpandToggle}>
          {hasChildren ? (
            <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
          ) : (
            <span style={{ display: 'inline-block', width: 12 }} />
          )}
        </span>
        <FontAwesomeIcon 
          icon={expanded && hasChildren && node.className === 'Folder' ? faFolderOpen : icon} 
          className="tree-class-icon" 
        />
        <span className="tree-node-name">{node.name}</span>
        <span className="tree-node-class">{node.className}</span>
      </div>
      {expanded && hasChildren && (
        <div className="tree-children">
          {node.children.map((child, i) => (
            <TreeNode 
              key={`${child.path}_${i}`} 
              node={child} 
              depth={depth + 1} 
              isDark={isDark}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Explorer: React.FC<ExplorerProps> = ({ tree, isOpen, onClose, onRefresh, isDark }) => {
  const [selectedNode, setSelectedNode] = useState<ExplorerNode | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="explorer-overlay" onClick={onClose} />
      <div className={`explorer-panel ${isDark ? 'dark' : 'light'}`}>
        <div className="explorer-header">
          <div className="explorer-title">
            <FontAwesomeIcon icon={faGlobe} className="explorer-globe-icon" />
            <span>Roblox Explorer</span>
          </div>
          <div className="explorer-header-actions">
            {onRefresh && (
              <button className="explorer-btn" onClick={onRefresh} title="Reset / Refresh hierarchy">
                <FontAwesomeIcon icon={faRotateRight} />
              </button>
            )}
            <button className="explorer-btn" onClick={onClose} title="Close Explorer">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        <div className="explorer-body">
          {tree ? (
            <TreeNode 
              node={tree} 
              depth={0} 
              isDark={isDark}
              selectedPath={selectedNode?.path ?? null}
              onSelect={setSelectedNode}
            />
          ) : (
            <div className="explorer-empty">
              <FontAwesomeIcon icon={faCircleInfo} />
              <span>No DataModel active</span>
            </div>
          )}
        </div>

        {/* Selected Instance Property Inspector */}
        {selectedNode && (
          <div className="explorer-inspector">
            <div className="inspector-header">
              <span className="inspector-title">Properties: {selectedNode.name}</span>
              <button className="inspector-close" onClick={() => setSelectedNode(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="inspector-properties">
              <div className="property-row">
                <span className="prop-name">ClassName</span>
                <span className="prop-value">{selectedNode.className}</span>
              </div>
              <div className="property-row">
                <span className="prop-name">Name</span>
                <span className="prop-value">{selectedNode.name}</span>
              </div>
              <div className="property-row">
                <span className="prop-name">Full Path</span>
                <span className="prop-value font-mono">{selectedNode.path}</span>
              </div>
              <div className="property-row">
                <span className="prop-name">Children</span>
                <span className="prop-value">{selectedNode.children?.length ?? 0}</span>
              </div>
              {selectedNode.properties && Object.entries(selectedNode.properties).map(([k, v]) => (
                <div key={k} className="property-row">
                  <span className="prop-name">{k}</span>
                  <span className="prop-value">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Explorer;
