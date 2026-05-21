export type ActivityType = 
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED';

// Only show these core activities in the feed
export const CORE_ACTIVITY_TYPES: ActivityType[] = ['TASK_CREATED', 'ATTACHMENT_ADDED'];

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
