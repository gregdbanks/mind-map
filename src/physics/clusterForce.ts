import * as d3 from 'd3';
import type { Node } from '../types/mindMap';

/**
 * Custom force that clusters nodes based on their branch membership
 */
export function forceCluster() {
  let nodes: Node[] = [];
  let strength = 0.1;
  
  // Map to store branch centers
  const branchCenters = new Map<string, { x: number; y: number; angle: number }>();
  
  function force(alpha: number) {
    // First pass: identify branch positions and angles
    nodes.forEach(node => {
      if (!node.parent) {
        // This is the root - skip
        return;
      }
      
      // Find the branch this node belongs to
      let branchId = '';
      let current = node;
      const visited = new Set<string>();
      
      while (current.parent && !visited.has(current.id)) {
        visited.add(current.id);
        const parent = nodes.find(n => n.id === current.parent);
        if (!parent) break;
        
        // If parent is root, current is the branch head
        if (!parent.parent) {
          branchId = current.id;
          break;
        }
        current = parent;
      }
      
      // Store branch center if this is a branch head
      if (branchId === node.id && node.x !== undefined && node.y !== undefined) {
        const root = nodes.find(n => !n.parent);
        if (root && root.x !== undefined && root.y !== undefined) {
          const angle = Math.atan2(node.y - root.y, node.x - root.x);
          branchCenters.set(branchId, {
            x: node.x,
            y: node.y,
            angle: angle
          });
        }
      }
    });
    
    // Second pass: pull nodes toward their branch center
    nodes.forEach(node => {
      if (!node.parent || node.x === undefined || node.y === undefined) return;
      
      // Find which branch this node belongs to
      let branchId = '';
      let current = node;
      const visited = new Set<string>();
      
      while (current.parent && !visited.has(current.id)) {
        visited.add(current.id);
        const parent = nodes.find(n => n.id === current.parent);
        if (!parent) break;
        
        if (!parent.parent) {
          branchId = current.id;
          break;
        }
        current = parent;
      }
      
      // Apply force toward branch direction
      const branchCenter = branchCenters.get(branchId);
      if (branchCenter) {
        const root = nodes.find(n => !n.parent);
        if (root && root.x !== undefined && root.y !== undefined) {
          // Calculate where this node should be based on branch angle
          const nodeDistanceFromRoot = Math.sqrt(
            Math.pow(node.x - root.x, 2) + Math.pow(node.y - root.y, 2)
          );
          
          // Target position along branch angle
          const targetX = root.x + nodeDistanceFromRoot * Math.cos(branchCenter.angle);
          const targetY = root.y + nodeDistanceFromRoot * Math.sin(branchCenter.angle);
          
          // Apply force toward target
          const dx = targetX - node.x;
          const dy = targetY - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const forceStrength = strength * alpha * Math.min(distance / 100, 1);
            node.vx = (node.vx || 0) + dx * forceStrength;
            node.vy = (node.vy || 0) + dy * forceStrength;
          }
        }
      }
    });
  }
  
  force.nodes = function(n?: Node[]) {
    if (arguments.length) {
      nodes = n || [];
      return force;
    }
    return nodes;
  };
  
  force.strength = function(s?: number) {
    if (arguments.length) {
      strength = s || 0.1;
      return force;
    }
    return strength;
  };
  
  return force;
}