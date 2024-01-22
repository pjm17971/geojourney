import { User } from 'firebase/auth';
import { assign } from 'xstate';
import { Activity } from './types';

const clearUser = assign({ user: () => null });

const assignUser = assign({
  user: (_: unknown, params: { user: User | null }) => params.user,
});

const assignFile = assign({
  file: (_: unknown, params: { file: File | null }) => params.file,
});

const assignUploadProgress = assign({
  fileUploadProgress: (_: unknown, params: { progress: number }) => params.progress,
});

// assignUploadStatus: assign({ fileUploadStatus: ({ event }) => event.status }),

// assignUploadError: assign({ fileUploadError: ({ event }) => event.error.message }),

const assignActivities = assign({
  activities: (_: unknown, params: { activities: Activity[] }) => params.activities,
});

const assignEmailAndPassword = assign({
  email: (_: unknown, params: { email: string; password: string }) => params.email,
  password: (_: unknown, params: { email: string; password: string }) => params.password,
});

const assignSelectedActivityId = assign({
  selectedActivityId: (_: unknown, params: { activityId: string }) => params.activityId,
});

const assignSelectedActivity = assign({
  selectedActivity: (_, params: { activity: Activity }) => params.activity,
});

export const actions = {
  clearUser,
  assignUser,
  assignFile,
  assignUploadProgress,
  assignActivities,
  assignEmailAndPassword,
  assignSelectedActivityId,
  assignSelectedActivity,
};
