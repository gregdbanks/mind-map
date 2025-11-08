import type { Node } from '../types/mindMap';

export function getNodeDescendants(nodeId: string, nodesMap: Map<string, Node>): Set<string> {
  const descendants = new Set<string>();
  
  const addDescendants = (currentNodeId: string) => {
    // Find all children of the current node
    nodesMap.forEach((node, id) => {
      if (node.parent === currentNodeId && !descendants.has(id)) {
        descendants.add(id);
        // Recursively add descendants of this child
        addDescendants(id);
      }
    });
  };
  
  addDescendants(nodeId);
  return descendants;
}

export function getAllConnectedNodes(nodeId: string, nodesMap: Map<string, Node>): Set<string> {
  const connected = new Set<string>();
  connected.add(nodeId);
  
  // Add all descendants recursively
  const descendants = getNodeDescendants(nodeId, nodesMap);
  descendants.forEach(id => connected.add(id));
  
  return connected;
}