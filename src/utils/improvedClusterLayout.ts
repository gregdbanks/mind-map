import type { Node } from '../types/mindMap';
import { calculateNodeDepths } from './nodeHierarchy';

interface ClusterNode extends Node {
  cluster?: string;
  depth?: number;
}

export function createImprovedClusterLayout(
  nodes: Map<string, Node>,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeArray = Array.from(nodes.values()) as ClusterNode[];
  
  // Ensure we have valid dimensions, fallback to reasonable defaults
  const fullWidth = width > 0 ? width : 1200;
  const fullHeight = height > 0 ? height : 800;
  
  // Add safe margins to avoid UI elements
  const topMargin = 120;  // Space for toolbar and tooltip
  const sideMargin = 50;   // General padding
  const bottomMargin = 50;
  
  // Calculate usable area
  const viewportWidth = fullWidth - (2 * sideMargin);
  const viewportHeight = fullHeight - topMargin - bottomMargin;
  const offsetX = sideMargin;
  const offsetY = topMargin;
  
  // Calculate depths
  const depths = calculateNodeDepths(nodes);
  nodeArray.forEach(node => {
    node.depth = depths.get(node.id) || 0;
  });
  
  // Find root
  const root = nodeArray.find(n => !n.parent);
  if (!root) return positions;
  
  // Calculate complexity metrics
  const totalNodes = nodeArray.length;
  
  // Count children per node
  const childCounts = new Map<string, number>();
  nodeArray.forEach(node => {
    if (node.parent) {
      childCounts.set(node.parent, (childCounts.get(node.parent) || 0) + 1);
    }
  });
  const avgChildren = totalNodes > 1 ? Array.from(childCounts.values()).reduce((a, b) => a + b, 0) / childCounts.size : 1;
  
  // Center root in usable area
  positions.set(root.id, { 
    x: offsetX + viewportWidth / 2, 
    y: offsetY + viewportHeight / 2 
  });
  
  // Get first-level branches (clusters)
  const branches = nodeArray.filter(n => n.parent === root.id);
  
  // Assign each node to a cluster
  const clusterAssignments = new Map<string, string>();
  nodeArray.forEach(node => {
    if (!node.parent) {
      clusterAssignments.set(node.id, node.id);
    } else {
      // Find which branch this node belongs to
      let current = node;
      while (current.parent && current.parent !== root.id) {
        const parent = nodeArray.find(n => n.id === current.parent);
        if (!parent) break;
        current = parent;
      }
      if (current.parent === root.id) {
        clusterAssignments.set(node.id, current.id);
        node.cluster = current.id;
      }
    }
  });
  
  // Position branches with better spacing
  const baseAngleStep = (2 * Math.PI) / branches.length;
  
  // Dynamic root radius based on complexity
  const complexityFactor = Math.log10(totalNodes + 1) * Math.sqrt(avgChildren);
  const baseRadius = 200; // Increased base
  const rootRadius = baseRadius + (complexityFactor * 50); // More aggressive scaling
  
  branches.forEach((branch, i) => {
    // Each branch gets its own sector to prevent overlap
    const angle = i * baseAngleStep - Math.PI / 2;
    const radius = rootRadius;
    
    const x = offsetX + viewportWidth / 2 + radius * Math.cos(angle);
    const y = offsetY + viewportHeight / 2 + radius * Math.sin(angle);
    
    // Clamp to usable area with some buffer
    const bufferX = viewportWidth * 0.5;
    const bufferY = viewportHeight * 0.5;
    const clampedX = Math.max(offsetX - bufferX, Math.min(offsetX + viewportWidth + bufferX, x));
    const clampedY = Math.max(offsetY - bufferY, Math.min(offsetY + viewportHeight + bufferY, y));
    
    positions.set(branch.id, { x: clampedX, y: clampedY });
    
    // Pass sector information to prevent overlap between clusters
    const sectorStart = angle - baseAngleStep / 2;
    const sectorEnd = angle + baseAngleStep / 2;
    
    // Position all nodes in this cluster within its sector
    positionClusterNodes(
      branch, nodeArray, positions, angle, 
      clampedX, clampedY, viewportWidth, viewportHeight,
      sectorStart, sectorEnd, viewportWidth / 2, viewportHeight / 2
    );
  });
  
  return positions;
}

function positionClusterNodes(
  clusterHead: ClusterNode,
  allNodes: ClusterNode[],
  positions: Map<string, { x: number; y: number }>,
  clusterAngle: number,
  clusterX: number,
  clusterY: number,
  _viewportWidth: number,
  _viewportHeight: number,
  sectorStart: number,
  sectorEnd: number,
  centerX: number,
  centerY: number
) {
  // Get all nodes in this cluster (excluding the cluster head)
  const clusterNodes = allNodes.filter(n => 
    n.cluster === clusterHead.id && n.id !== clusterHead.id
  );
  
  if (clusterNodes.length === 0) return;
  
  // Group by depth
  const nodesByDepth = new Map<number, ClusterNode[]>();
  clusterNodes.forEach(node => {
    const depth = node.depth || 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });
  
  // Position nodes by depth rings
  const depthLevels = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
  
  depthLevels.forEach(depth => {
    const nodesAtDepth = nodesByDepth.get(depth) || [];
    
    // Dynamic progressive spacing based on cluster complexity
    const clusterComplexity = Math.log10(clusterNodes.length + 1);
    const densityMultiplier = 1 + (clusterComplexity * 0.5); // Increased multiplier
    
    const baseSpacing = 150; // Increased base spacing
    let ringRadius = 0;
    
    if (depth === 2) {
      ringRadius = baseSpacing * densityMultiplier;
    } else if (depth === 3) {
      ringRadius = (baseSpacing * 2.5) * densityMultiplier; // More space
    } else if (depth === 4) {
      ringRadius = (baseSpacing * 4.5) * densityMultiplier; // Much more space
    } else if (depth > 4) {
      // Progressive increase for deeper levels
      ringRadius = (baseSpacing * (4.5 + (depth - 4) * 2)) * densityMultiplier;
    }
    
    if (nodesAtDepth.length === 1) {
      // Single node continues in cluster direction
      const distanceFromCenter = Math.sqrt(
        Math.pow(clusterX - centerX, 2) + Math.pow(clusterY - centerY, 2)
      ) + ringRadius;
      
      const x = centerX + distanceFromCenter * Math.cos(clusterAngle);
      const y = centerY + distanceFromCenter * Math.sin(clusterAngle);
      
      // No clamping - allow natural expansion
      positions.set(nodesAtDepth[0].id, { x, y });
    } else {
      // Multiple nodes spread within the sector
      const sectorWidth = sectorEnd - sectorStart;
      // Dynamic sector usage based on node count
      const nodeCountFactor = Math.min(1, nodesAtDepth.length / 10);
      let usableSectorWidth;
      
      if (depth === 2) {
        usableSectorWidth = sectorWidth * (0.5 + nodeCountFactor * 0.3);
      } else if (depth === 3) {
        usableSectorWidth = sectorWidth * (0.7 + nodeCountFactor * 0.25);
      } else {
        // For depth 4 and beyond, use nearly full sector width
        usableSectorWidth = sectorWidth * (0.9 + nodeCountFactor * 0.09);
      }
      
      const angleStep = nodesAtDepth.length > 1 ? usableSectorWidth / (nodesAtDepth.length - 1) : 0;
      const startAngle = clusterAngle - usableSectorWidth / 2;
      
      nodesAtDepth.forEach((node, i) => {
        const nodeAngle = startAngle + i * angleStep;
        
        // Position from center, not from cluster head
        const distanceFromCenter = Math.sqrt(
          Math.pow(clusterX - centerX, 2) + Math.pow(clusterY - centerY, 2)
        ) + ringRadius;
        
        const x = centerX + distanceFromCenter * Math.cos(nodeAngle);
        const y = centerY + distanceFromCenter * Math.sin(nodeAngle);
        
        // No clamping - allow natural expansion
        positions.set(node.id, { x, y });
      });
    }
  });
  
  // Apply force-like adjustments to prevent overlap within cluster
  // Group nodes by depth for better overlap prevention
  const nodesByDepthMap = new Map<number, typeof clusterNodes>();
  clusterNodes.forEach(node => {
    const depth = node.depth || 0;
    if (!nodesByDepthMap.has(depth)) {
      nodesByDepthMap.set(depth, []);
    }
    nodesByDepthMap.get(depth)!.push(node);
  });
  
  for (let iter = 0; iter < 5; iter++) {
    clusterNodes.forEach(node => {
      const nodePos = positions.get(node.id);
      if (!nodePos) return;
      
      let dx = 0;
      let dy = 0;
      let count = 0;
      
      // Check against other nodes at same depth or adjacent depths
      const nodeDepth = node.depth || 0;
      for (let d = nodeDepth - 1; d <= nodeDepth + 1; d++) {
        const nodesAtDepth = nodesByDepthMap.get(d) || [];
        nodesAtDepth.forEach(other => {
          if (node.id === other.id) return;
          const otherPos = positions.get(other.id);
          if (!otherPos) return;
          
          const distance = Math.sqrt(
            Math.pow(nodePos.x - otherPos.x, 2) + 
            Math.pow(nodePos.y - otherPos.y, 2)
          );
          
          // Larger minimum distance for outer nodes
          const minDistance = nodeDepth >= 4 ? 120 : 100;
          if (distance < minDistance && distance > 0) {
            const force = (minDistance - distance) / distance;
            dx += (nodePos.x - otherPos.x) * force * 0.5;
            dy += (nodePos.y - otherPos.y) * force * 0.5;
            count++;
          }
        });
      }
      
      // Apply adjustments
      if (count > 0) {
        nodePos.x += dx;
        nodePos.y += dy;
      }
    });
  }
}