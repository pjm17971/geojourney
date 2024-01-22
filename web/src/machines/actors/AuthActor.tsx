import { fromCallback } from 'xstate';
import { auth } from '../../firebaseconfig';
import { User, onAuthStateChanged } from 'firebase/auth';

export type AuthActorEvents = { type: 'AUTHENTICATED'; data: User } | { type: 'UNAUTHENTICATED' };

export type AuthActorArg = {
  sendBack: (event: AuthActorEvents) => void;
};

export const authActor = fromCallback(({ sendBack }: AuthActorArg) => {
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
