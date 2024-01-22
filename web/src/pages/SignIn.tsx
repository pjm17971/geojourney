import React, { useState } from 'react';
import { MachineContext } from '../contexts/MachineContext';
import { Button, TextField, Container, Typography } from '@mui/material';

const SignIn: React.FC = () => {
  const actorRef = MachineContext.useActorRef();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => actorRef.send({ type: 'SIGNIN', email, password });

  return (
    <Container component="main" maxWidth="xs">
      <Typography variant="h5" align="center">
        Login
      </Typography>
      <form>
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="button" fullWidth variant="contained" color="primary" onClick={signIn}>
          Login
        </Button>
      </form>
    </Container>
  );
};

export default SignIn;
