/** Response from POST /mindmaps/:id/share */
export interface ShareInfo {
  share_token: string;
  shared_at: string;
}

/** Response from GET /mindmaps/:id/share */
export interface ShareStatus {
  is_public: boolean;
  share_token: string | null;
  shared_at: string | null;
}

/** User plan info returned alongside map list */
export interface UserPlan {
  plan: 'free' | 'pro';
  mapCount: number;
  mapLimit: number | null;
}
