import './App.css';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/Landing';
import { MachineContext } from './MachineContext';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

export const App = () => {
  const actorRef = MachineContext.useActorRef();
  const [state, setState] = useState<object>();
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const sub = actorRef.subscribe((snapshot) => {
      console.log(snapshot?.value);
      setState(snapshot?.value);
      setUser(snapshot?.context.user);
    });
    return () => sub.unsubscribe();
  }, [actorRef]);

  if (user) {
    console.log('We have a user', user);
  }

  return (
    <>
      {user ? <Dashboard /> : <LandingPage />}

      <hr style={{ marginTop: 100 }} />

      <p>{JSON.stringify(state, null, 3)}</p>
    </>
  );
};
