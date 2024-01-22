import { fromPromise, setup, assign, log, sendTo } from 'xstate';
import { auth } from '../firebaseconfig';

import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { AuthActorEvents, authActor } from './actors/AuthActor';
import { Activity, EmailPassword } from './types';
import { FileUploadEvents, fileUploadActor } from './actors/FileUploadActor';
import { DatabaseActorEmitedEvents, databaseActor } from './actors/DatabaseActor';

type UserEvents =
  | { type: 'SIGNUP'; email: string; password: string }
  | { type: 'SIGNIN'; email: string; password: string }
  | { type: 'SIGNOUT' }
  | { type: 'UPLOAD'; file: File }
  | { type: 'SELECT_ACTIVITY'; activityId: string };

const signUpService = fromPromise(({ input }: EmailPassword) => {
  const { email, password } = input;
  return createUserWithEmailAndPassword(auth, email!, password!);
});

const signInService = fromPromise(({ input }: EmailPassword) => {
  const { email, password } = input;
  return signInWithEmailAndPassword(auth, email!, password!);
});

const signOutService = fromPromise(() => {
  return signOut(auth);
});

// const increment = ({ context }: { context: MyContext }) => ({
//   count: context.count + 1,
// });

export const machine = setup({
  types: {
    context: {} as {
      user: User | null;
      file: File | null;
      fileUploadStatus: string | null;
      fileUploadProgress: number | null;
      fileUploadError: string | null;
      activities: Activity[];
      selectedActivityId: string | null;
      selectedActivity: Activity | null;
      email: string | null;
      password: string | null;
    },
    events: {} as AuthActorEvents | FileUploadEvents | DatabaseActorEmitedEvents | UserEvents,
  },
  actions: {
    clearUser: assign({ user: () => null }),
    assignUser: assign({ user: (_, params: { user: User | null }) => params.user }),
    assignFile: assign({ file: (_, params: { file: File | null }) => params.file }),
    assignUploadProgress: assign({
      fileUploadProgress: (_, params: { progress: number }) => params.progress,
    }),
    assignActivities: assign({
      activities: (_, params: { activities: Activity[] }) => params.activities,
    }),
    assignEmailAndPassword: assign({
      email: (_, params: { email: string; password: string }) => params.email,
      password: (_, params: { email: string; password: string }) => params.password,
    }),
    assignSelectedActivityId: assign({
      selectedActivityId: (_, params: { activityId: string }) => params.activityId,
    }),
    assignSelectedActivity: assign({
      selectedActivity: (_, params: { activity: Activity }) => params.activity,
    }),
  },
  actors: {
    authActor,
    fileUploadActor,
    databaseActor,
    signOutService,
    signInService,
    signUpService,
  },
}).createMachine({
  id: 'geo',
  initial: 'initial',
  context: {
    user: null,
    email: null,
    password: null,
    file: null,
    fileUploadStatus: null,
    fileUploadProgress: null,
    fileUploadError: null,
    activities: [],
    selectedActivityId: null,
    selectedActivity: null,
  },

  invoke: {
    id: 'auth',
    src: 'authActor',
  },

  on: {
    ACTIVITIES_UPDATE: {
      actions: [
        {
          type: 'assignActivities',
          params: ({ event }) => ({ activities: event.activities }),
        },
      ],
    },
  },

  states: {
    /**
     * In the initial state we don't know if the user is authenticated
     * or not. As we have already set up the authActor to watch the
     * auth state we will get either an AUTHENTICATED or UNAUTHENTICATED
     * message. From these we can transition to the correct state with
     * a valid user (or not)
     */
    initial: {
      on: {
        AUTHENTICATED: {
          target: 'authenticated',
          actions: {
            type: 'assignUser',
            params: ({ event }) => {
              console.log('AUTHENTICATED');
              return { user: event.data };
            },
          },
        },
        UNAUTHENTICATED: {
          target: 'unauthenticated',
          actions: 'clearUser',
        },
      },
    },

    /**
     * The app is in a known unauthenticated states. The user
     * may signup or signin in which case the application will
     * transition to those states. The auth query may also
     * update to put the app in an authenticated state.
     */
    unauthenticated: {
      on: {
        SIGNUP: {
          target: 'signingUp',
          actions: {
            type: 'assignEmailAndPassword',
            params: ({ event }) => ({ email: event.email, password: event.password }),
          },
        },
        SIGNIN: {
          target: 'signingIn',
          actions: {
            type: 'assignEmailAndPassword',
            params: ({ event: { email, password } }) => ({ email, password }),
          },
        },
        AUTHENTICATED: {
          target: 'authenticated',
          actions: { type: 'assignUser', params: ({ event: { data } }) => ({ user: data }) },
        },
      },
    },

    /**
     * The app is in a known authenticated states. The user may sign out in which case the
     * authenticated state will change via the UNAUTHENTICATED message (or the server can also log
     * out the user)
     */
    authenticated: {
      entry: log('ENTRY authenticated'),
      exit: log('EXIT authenticated'),

      invoke: {
        id: 'db',
        src: 'databaseActor',
        input: ({ context }) => ({
          user: context.user,
        }),
      },

      on: {
        SIGNOUT: {
          target: '.signingOut',
        },
        UPLOAD: {
          target: '.uploading',
          actions: { type: 'assignFile', params: ({ event: { file } }) => ({ file }) },
        },
        UNAUTHENTICATED: {
          target: 'unauthenticated',
          actions: 'clearUser',
        },
        SELECT_ACTIVITY: {
          actions: [
            log(({ event }) => {
              return `SELECT_ACTIVITY handled for ${event.activityId}`;
            }),
            sendTo('db', ({ event }) => ({
              type: 'ACTIVITY_SUBSCRIBE',
              activityId: event.activityId,
            })),
            {
              type: 'assignSelectedActivityId',
              params: ({ event: { activityId } }) => ({ activityId }),
            },
          ],
        },
        ACTIVITY_UPDATE: {
          actions: [
            log(({ event }) => {
              return `ACTIVITY_UPDATE handled for ${JSON.stringify(event.activity)}`;
            }),
            {
              type: 'assignSelectedActivity',
              params: ({ event: { activity } }) => ({ activity }),
            },
          ],
        },
      },
      initial: 'idle',
      states: {
        idle: {},
        uploading: {
          invoke: {
            src: 'fileUploadActor',
            input: ({ context }) => ({ user: context.user, file: context.file }),
          },
          on: {
            UPLOAD_PROGRESS: {
              actions: {
                type: 'assignUploadProgress',
                params: ({ event }) => ({ progress: event.progress }),
              },
            },
            // UPLOAD_STATUS: {
            //   actions: 'assignUploadStatus',
            // },
            // UPLOAD_FAILED: {
            //   actions: 'assignUploadError',
            // },
            UPLOAD_COMPLETED: {
              target: 'idle',
            },
          },
        },
        signingOut: {
          invoke: {
            src: 'signOutService',
            onDone: {
              target: '..unauthenticated',
              actions: 'clearUser',
            },
            onError: 'idle',
          },
        },
      },
    },

    signingUp: {
      invoke: {
        src: 'signUpService',
        input: ({ context }) => ({
          email: context.email,
          password: context.password,
        }),
        onDone: {
          target: 'authenticated',
          actions: { type: 'assignUser', params: ({ event }) => ({ user: event.output.user }) },
        },
        onError: 'unauthenticated',
      },
    },

    signingIn: {
      invoke: {
        src: 'signInService',
        input: ({ context }) => ({
          email: context.email,
          password: context.password,
        }),
        onDone: {
          target: 'authenticated',
          actions: { type: 'assignUser', params: ({ event }) => ({ user: event.output.user }) },
        },
        onError: 'unauthenticated',
      },
    },
  },
});
