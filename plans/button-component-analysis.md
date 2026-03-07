# UI Button Component Usage Analysis

## Summary
The app has a `PrimaryButton` component in [`client/src/components/UI/Buttons.tsx`](client/src/components/UI/Buttons.tsx:1) but it's **only used in auth pages**. Most other screens use manual `TouchableOpacity + Text` button implementations, creating UI inconsistency.

---

## ✅ Pages Using PrimaryButton Component (Consistent)

| File | Buttons |
|------|---------|
| [`client/src/app/(auth)/login.tsx`](client/src/app/(auth)/login.tsx:243) | Sign In, Continue with Google |
| [`client/src/app/(auth)/signup.tsx`](client/src/app/(auth)/signup.tsx:314) | Sign Up, Continue with Google |
| [`client/src/app/(auth)/forgot-password.tsx`](client/src/app/(auth)/forgot-password.tsx:164) | Send Reset Link |
| [`client/src/app/(auth)/reset-password.tsx`](client/src/app/(auth)/reset-password.tsx:282) | Reset Password |
| [`client/src/app/(auth)/verify-reset-token.tsx`](client/src/app/(auth)/verify-reset-token.tsx:163) | Verify Code |

---

## ❌ Pages With Manual Button Implementation (Need Refactoring)

### High Priority (Form Actions / Primary CTAs)

| File | Button Type | Issue |
|------|-------------|-------|
| [`client/src/app/settings/EditProfile.tsx`](client/src/app/settings/EditProfile.tsx:156) | Save Changes (blue), Delete Account (red ghost) | Inconsistent styling |
| [`client/src/app/profile.tsx`](client/src/app/profile.tsx:150) | Edit Profile (ghost) | Should use PrimaryButton variant |
| [`client/src/app/settings/HelpSupport.tsx`](client/src/app/settings/HelpSupport.tsx:47) | Email Support (blue) | Should use PrimaryButton |
| [`client/src/app/index.tsx`](client/src/app/index.tsx:162) | Retry (red), Create Project (purple), View Projects (purple) | Multiple manual buttons |
| [`client/src/app/index.tsx`](client/src/app/index.tsx:378) | Cancel, Create (in modal) | Manual implementation |

### Medium Priority (List Items / Secondary Actions)

| File | Button Type |
|------|-------------|
| [`client/src/app/tasks.tsx`](client/src/app/tasks.tsx:459) | Clear Filters, Apply Filters |
| [`client/src/app/tasks.tsx`](client/src/app/tasks.tsx:690) | Add Task (FAB) |
| [`client/src/app/tasks.tsx`](client/src/app/tasks.tsx:827) | Create Task (FAB) |
| [`client/src/app/projects/page.tsx`](client/src/app/projects/page.tsx:506) | Create, Cancel (in modal) |
| [`client/src/app/projects/[id].tsx`](client/src/app/projects/[id].tsx:125) | Back to Projects |
| [`client/src/app/projects/[id].tsx`](client/src/app/projects/[id].tsx:496) | Upload Attachment |

### Lower Priority (Icon Buttons / Small Actions)

| File | Button Type |
|------|-------------|
| [`client/src/app/projects/[id]/statuses.tsx`](client/src/app/projects/[id]/statuses.tsx:161) | Edit/Delete status icons |
| [`client/src/app/projects/[id]/priorities.tsx`](client/src/app/projects/[id]/priorities.tsx:161) | Edit/Delete priority icons |
| [`client/src/app/projects/[id]/members.tsx`](client/src/app/projects/[id]/members.tsx:121) | Remove member |
| [`client/src/app/tasks/[id].tsx`](client/src/app/tasks/[id].tsx:210) | Back, Retry |
| [`client/src/app/tasks/[id].tsx`](client/src/app/tasks/[id].tsx:322) | Post Comment |
| [`client/src/app/settings/CalendarSettings.tsx`](client/src/app/settings/CalendarSettings.tsx:143) | Disconnect, Connect calendar |

---

## Button Patterns Found in Manual Implementation

### Common Patterns Used:
1. **Primary Blue**: `bg-blue-600 rounded-xl py-3 items-center`
2. **Secondary/Ghost**: `border border-gray-600 rounded-xl py-2.5 px-4`
3. **Danger Red**: `bg-red-600 rounded-xl py-3 items-center`
4. **Danger Ghost**: `border border-red-500 rounded-xl py-3`

### Issues Identified:
- Inconsistent height (py-2, py-2.5, py-3, py-4)
- Inconsistent border radius (rounded-lg, rounded-xl, rounded-2xl)
- No consistent disabled state styling
- No loading state handling in most places

---

## Recommendation

1. **Enhance PrimaryButton** to support:
   - `variant="primary" | "secondary" | "danger" | "danger-ghost"`
   - `size="small" | "medium" | "large"`
   - Proper disabled styling with opacity

2. **Create a secondary GhostButton** component for secondary actions

3. **Refactor high-priority pages first**:
   - EditProfile.tsx
   - profile.tsx  
   - HelpSupport.tsx
   - index.tsx (modal buttons)
   - tasks.tsx (filter buttons, FAB)

4. **Keep icon-only buttons** (edit/delete) as they are - they're UI-specific
