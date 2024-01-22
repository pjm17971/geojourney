import './App.css';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/Landing';
import { MachineContext } from './contexts/MachineContext';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

export const App = () => {
  const actorRef = MachineContext.useActorRef();

  const [state, setState] = useState<object>();
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const sub = actorRef.subscribe((snapshot) => {
      setState(snapshot?.value);
      setUser(snapshot?.context.user);
    });
    return () => sub.unsubscribe();
  }, [actorRef]);

  return <>{user ? <Dashboard /> : <LandingPage />}</>;
};
