import { useEffect, useState } from 'react';
import './App.css';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseconfig';

import Dashboard from './Dashboard';
import LandingPage from './Landing';

import { signOut } from 'firebase/auth';

export const App = () => {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => {
    signOut(auth).then(() => {
      console.log('User signed out');
      setUser(null);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User signed in:', user);
        setUser(user);
        // handle signed-in user
      } else {
        console.log('No user signed in');
        // handle signed-out user
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {user ? (
        <div>
          <Dashboard />
          <button onClick={logout}>Log Out</button>
        </div>
      ) : (
        <LandingPage />
      )}
    </>
  );
};
