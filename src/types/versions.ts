export interface VersionMeta {
  id: string;
  version_number: number;
  title: string;
  node_count: number;
  created_at: string;
}

export interface VersionFull extends VersionMeta {
  map_id: string;
  data: {
    nodes: import('./mindMap').Node[];
    links: import('./mindMap').Link[];
    notes?: import('./sync').SerializedNote[];
    canvasBackground?: string;
  };
}

export interface VersionListResponse {
  versions: VersionMeta[];
}
