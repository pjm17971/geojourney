import React, { useState } from 'react';
import { MachineContext } from '../MachineContext';
import { Button, TextField, Container, Typography } from '@mui/material';

const SignUp: React.FC = () => {
  const actorRef = MachineContext.useActorRef();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = async () => actorRef.send({ type: 'SIGNUP', email, password });

  return (
    <Container component="main" maxWidth="xs">
      <Typography variant="h5" align="center" color="textPrimary">
        Sign Up
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
          color="primary"
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
          color="primary"
        />
        <Button type="button" fullWidth variant="contained" color="primary" onClick={signUp}>
          Sign Up
        </Button>
      </form>
    </Container>
  );
};

export default SignUp;
