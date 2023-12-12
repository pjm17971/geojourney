import { AnyEventObject, assign, fromCallback, fromPromise, setup } from 'xstate';
import { auth, storage, db } from './firebaseconfig';

import {
  StorageError,
  UploadTask,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { collection, onSnapshot, query } from 'firebase/firestore';

export interface Activity {
  name: string;
  duration: number;
  distance: number;
  source: string;
  uploaded: Date;
}

type AuthActorEvents = { type: 'AUTHENTICATED'; data: User } | { type: 'UNAUTHENTICATED' };

type AuthActorArg = {
  sendBack: (event: AuthActorEvents) => void;
};

const authActor = fromCallback(({ sendBack }: AuthActorArg) => {
  console.log('AUTH: authActor started!!!');
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('AUTH: Sending back authenticated user');
      sendBack({ type: 'AUTHENTICATED', data: user });
    } else {
      console.log('AUTH: Sending back unauthenticated');
      sendBack({ type: 'UNAUTHENTICATED' });
    }
  });
  return () => {
    console.log('AUTH: authActor stopped!!!');
    unsubscribe();
  };
});

/**
 * Service to interface with firebase storage uploads. The service takes the current
 * user and upload file from context and begins a resumable upload using `uploadBytesResumable`.
 */

type FileUploaderEvents =
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_STATUS'; status: string }
  | { type: 'UPLOAD_FAILED'; error: StorageError }
  | { type: 'UPLOAD_COMPLETED'; url: string };

type FileUploaderArg = {
  sendBack: (event: FileUploaderEvents) => void;
  input: {
    user: User | null;
    file: File | null;
  };
};

const fileUploader = fromCallback(({ sendBack, input }: FileUploaderArg) => {
  const { user, file } = input;
  let uploader: UploadTask;
  if (user && file) {
    const userId = (user as User).uid;
    const metadata = {
      contentType: 'application/gpx+xml',
    };
    const imageRef = ref(storage, `gps_data/${userId}/${file.name}`);
    uploader = uploadBytesResumable(imageRef, file, metadata);
    uploader.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        sendBack({ type: 'UPLOAD_PROGRESS', progress });
        sendBack({ type: 'UPLOAD_STATUS', status: snapshot.state });
      },
      (error) => {
        sendBack({ type: 'UPLOAD_FAILED', error });
      },
      () => {
        getDownloadURL(uploader.snapshot.ref).then((downloadURL) => {
          sendBack({ type: 'UPLOAD_COMPLETED', url: downloadURL });
        });
      },
    );
  }
  return () => {
    if (uploader) {
      uploader.cancel();
    }
  };
});

/**
 * Service to interface with the Firebase Firestore database. The service takes the current
 * user and subscribes to the user's activities list
 */

type FirestoreService = {
  sendBack: (event: AnyEventObject) => void;
  input: {
    user: User | null;
  };
};

const firestoreService = fromCallback(({ sendBack, input }: FirestoreService) => {
  const { user } = input;

  console.log('Starting firestore service');

  if (user) {
    const ref = collection(db, 'users', user.uid, 'activities');
    const q = query(ref);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activities: Activity[] = [];

      querySnapshot.forEach((doc) => {
        const rawActivity = doc.data();
        const activity: Activity = {
          name: rawActivity.name,
          duration: rawActivity.duration,
          distance: rawActivity.distance,
          source: rawActivity.source,
          uploaded: new Date(rawActivity.uploaded),
        };
        activities.push(activity);
      });

      sendBack({ type: 'ACTIVITIES_UPDATE', activities });
    });

    return () => unsubscribe();
  }
});

type EmailPassword = {
  input: { email: string | null; password: string | null };
};

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

export const machine = setup({
  types: {
    context: {} as {
      user: User | null;
      file: File | null;
      fileUploadStatus: string | null;
      fileUploadProgress: number | null;
      fileUploadError: string | null;
      activities: Activity[];
      email: string | null;
      password: string | null;
    },
    events: {} as
      | AuthActorEvents
      | FileUploaderEvents
      | { type: 'SIGNUP'; email: string; password: string }
      | { type: 'SIGNIN'; email: string; password: string }
      | { type: 'SIGNOUT' }
      | { type: 'ACTIVITIES_UPDATE'; activities: Activity[] }
      | { type: 'UPLOAD'; file: File },
  },
  actions: {
    clearUser: assign({ user: () => null }),
    assignUser: assign({
      user: (_, params: { user: User | null }) => {
        console.log('assignUser', params);
        return params.user;
      },
    }),
    assignFile: assign({ file: (_, params: { file: File | null }) => params.file }),
    assignUploadProgress: assign({
      fileUploadProgress: (_, params: { progress: number }) => params.progress,
    }),
    // assignUploadStatus: assign({ fileUploadStatus: ({ event }) => event.status }),
    // assignUploadError: assign({ fileUploadError: ({ event }) => event.error.message }),
    assignActivities: assign({
      activities: (_, params: { activities: Activity[] }) => params.activities,
    }),
    assignEmailAndPassword: assign({
      email: (_, params: { email: string; password: string }) => params.email,
      password: (_, params: { email: string; password: string }) => params.password,
    }),
  },
  actors: {
    authActor,
    fileUploader,
    firestoreService,
    signOutService,
    signInService,
    signUpService,
  },
}).createMachine({
  id: 'geo',
  initial: 'initial',
  context: {
    user: null,
    file: null,
    fileUploadStatus: null,
    fileUploadProgress: null,
    fileUploadError: null,
    activities: [],
    email: null,
    password: null,
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
            params: ({ event }) => ({ email: event.email, password: event.password }),
          },
        },
        AUTHENTICATED: {
          target: 'authenticated',
          actions: { type: 'assignUser', params: ({ event }) => ({ user: event.data }) },
        },
      },
    },

    /**
     * The app is in a known authenticated states. The user
     * may sign out in which case the authenticated state will
     * change via the UNAUTHENTICATED message (or the server can also log
     * out the user)
     */
    authenticated: {
      invoke: {
        src: 'firestoreService',
        input: ({ context }) => ({ user: context.user }),
      },
      on: {
        SIGNOUT: {
          target: '.signingOut',
        },
        UPLOAD: {
          target: '.uploading',
          actions: { type: 'assignFile', params: ({ event }) => ({ file: event.file }) },
        },
        UNAUTHENTICATED: {
          target: 'unauthenticated',
          actions: 'clearUser',
        },
      },
      initial: 'idle',
      states: {
        idle: {},
        uploading: {
          invoke: {
            src: 'fileUploader',
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
