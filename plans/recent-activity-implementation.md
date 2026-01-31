# Recent Activity Feature Implementation Plan

## Overview
Implement a lively Recent Activity section in the project detail dashboard that tracks and displays task-related actions with user avatars, grouped by day, with pull-to-refresh and load more functionality.

## Requirements Summary

### Activity Types to Track
- Task created
- Task updated
- Comments added

### Display Format
- Show user who performed the action with their avatar
- Grouped by day (Today, Yesterday, etc.)
- Icons for different activity types
- Timestamps for each activity

### Pagination
- Configurable with "Load More" button
- Initial load: 10 activities
- Load more: 10 additional activities per click

### Update Method
- Pull-to-refresh functionality
- Manual refresh option

---

## Architecture

### 1. Backend Implementation

#### 1.1 Database Schema (Prisma)
```prisma
model Activity {
  id          String   @id @default(uuid())
  type        String   // "TASK_CREATED", "TASK_UPDATED", "COMMENT_ADDED"
  projectId   String
  userId      String
  taskId      String?
  commentId   String?
  metadata    Json?    // Additional data like task title, comment preview, etc.
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task        Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  comment     Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([createdAt])
}
```

#### 1.2 API Endpoints

**GET /api/projects/:projectId/activities**
- Query params: `page`, `limit` (default: 10)
- Returns: Paginated list of activities with user, task, and comment data
- Response format:
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "TASK_CREATED",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "profileImage": "url"
      },
      "task": {
        "id": "uuid",
        "title": "Task title"
      },
      "metadata": {
        "changes": { "status": { "from": "To Do", "to": "In Progress" } }
      },
      "createdAt": "2024-01-31T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "hasMore": true
  }
}
```

#### 1.3 Activity Logging Service
Create a service to log activities when actions occur:

**Task Created**: When a new task is created
```javascript
await logActivity({
  type: 'TASK_CREATED',
  projectId,
  userId,
  taskId: newTask.id,
  metadata: { taskTitle: newTask.title }
});
```

**Task Updated**: When a task is updated (status, priority, assignee, etc.)
```javascript
await logActivity({
  type: 'TASK_UPDATED',
  projectId,
  userId,
  taskId: task.id,
  metadata: {
    taskTitle: task.title,
    changes: { status: { from: oldStatus, to: newStatus } }
  }
});
```

**Comment Added**: When a comment is added to a task
```javascript
await logActivity({
  type: 'COMMENT_ADDED',
  projectId,
  userId,
  taskId: task.id,
  commentId: newComment.id,
  metadata: {
    taskTitle: task.title,
    commentPreview: newComment.content.substring(0, 50)
  }
});
```

### 2. Frontend Implementation

#### 2.1 TypeScript Types
```typescript
// client/src/types/activity.ts
export type ActivityType = 'TASK_CREATED' | 'TASK_UPDATED' | 'COMMENT_ADDED';

export interface Activity {
  id: string;
  type: ActivityType;
  user: {
    id: string;
    name: string;
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
```

#### 2.2 Activity Service
```typescript
// client/src/services/activityService.ts
export const getProjectActivities = async (
  projectId: string,
  page: number = 1,
  limit: number = 10
): Promise<ActivityResponse> => {
  // Fetch activities from backend
};
```

#### 2.3 UI Components

**ActivityItem Component**
- Displays single activity with:
  - User avatar
  - User name
  - Action description (e.g., "created task", "updated task", "added comment")
  - Task title (clickable to navigate to task)
  - Timestamp (relative time: "2 hours ago")
  - Icon based on activity type

**ActivitySection Component**
- Groups activities by day
- Displays "Today", "Yesterday", or date
- Shows list of ActivityItem components
- Pull-to-refresh functionality
- Load More button at bottom

#### 2.4 Project Detail Page Updates
- Import ActivitySection component
- Add state for activities, loading, pagination
- Implement pull-to-refresh using RefreshControl
- Load activities on component mount
- Reload activities when returning to the page

---

## Implementation Steps

### Phase 1: Backend Setup
1. Add Activity model to Prisma schema
2. Run database migration
3. Create activity controller with getActivities endpoint
4. Create activity service with logActivity function
5. Integrate activity logging into:
   - Task creation endpoint
   - Task update endpoint
   - Comment creation endpoint

### Phase 2: Frontend Service
1. Create activityService.ts with getProjectActivities function
2. Add Activity types to types/index.ts

### Phase 3: UI Components
1. Create ActivityItem component
2. Create ActivitySection component with:
   - Day grouping logic
   - Pull-to-refresh
   - Load more functionality
3. Add icons for different activity types

### Phase 4: Integration
1. Update project detail page to use ActivitySection
2. Replace placeholder Recent Activity section
3. Test activity tracking and display

---

## Activity Type Details

### TASK_CREATED
- Icon: `add-circle-outline` (blue)
- Text: "{user} created task {taskTitle}"
- Metadata: taskTitle

### TASK_UPDATED
- Icon: `create-outline` (orange)
- Text: "{user} updated task {taskTitle}"
- Metadata: taskTitle, changes (what was changed)
- Examples of changes:
  - Status: "changed status from To Do to In Progress"
  - Priority: "changed priority to High"
  - Assignee: "assigned to {assigneeName}"

### COMMENT_ADDED
- Icon: `chatbubble-outline` (green)
- Text: "{user} commented on {taskTitle}"
- Metadata: taskTitle, commentPreview
- Click to view comment

---

## Day Grouping Logic

```typescript
const groupActivitiesByDay = (activities: Activity[]) => {
  const groups: Record<string, Activity[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activities.forEach(activity => {
    const activityDate = new Date(activity.createdAt);
    activityDate.setHours(0, 0, 0, 0);

    let key: string;
    if (activityDate.getTime() === today.getTime()) {
      key = 'Today';
    } else if (activityDate.getTime() === yesterday.getTime()) {
      key = 'Yesterday';
    } else {
      key = activityDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
  });

  return groups;
};
```

---

## Relative Time Formatting

```typescript
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
```

---

## Files to Create/Modify

### Backend
- `server/prisma/schema.prisma` - Add Activity model
- `server/src/controllers/activity.controller.js` - New file
- `server/src/services/activity.service.js` - New file
- `server/src/routes/activity.router.js` - New file
- `server/src/routes/router.js` - Add activity routes
- `server/src/controllers/task.controller.js` - Add activity logging
- `server/src/controllers/comment.controller.js` - Add activity logging

### Frontend
- `client/src/types/activity.ts` - New file
- `client/src/services/activityService.ts` - New file
- `client/src/components/ActivityItem.tsx` - New file
- `client/src/components/ActivitySection.tsx` - New file
- `client/src/app/projects/[id].tsx` - Update to use ActivitySection

---

## Testing Checklist

- [ ] Activity is logged when task is created
- [ ] Activity is logged when task is updated
- [ ] Activity is logged when comment is added
- [ ] Activities display correctly with user avatars
- [ ] Activities are grouped by day correctly
- [ ] Pull-to-refresh works
- [ ] Load more button loads additional activities
- [ ] Clicking on task navigates to task detail
- [ ] Empty state displays correctly
- [ ] Timestamps show relative time correctly
