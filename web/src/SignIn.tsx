import React, { useState } from 'react';
import { auth } from './firebaseconfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      console.log('Sign-in with ', email, password);
      const user = await signInWithEmailAndPassword(auth, email, password);
      console.log('Signed in successfully', user);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signIn}>Sign In</button>
    </div>
  );
};

export default SignIn;
