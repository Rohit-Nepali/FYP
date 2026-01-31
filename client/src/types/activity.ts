export type ActivityType = 'TASK_CREATED' | 'TASK_UPDATED' | 'COMMENT_ADDED';

export interface Activity {
  id: string;
  type: ActivityType;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  task?: {
    id: string;
    title: string;
  };
  comment?: {
    id: string;
    content: string;
  };
  metadata?: {
    taskTitle?: string;
    commentPreview?: string;
    changes?: Record<string, any>;
  };
  createdAt: string;
}

export interface ActivityResponse {
  data: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
