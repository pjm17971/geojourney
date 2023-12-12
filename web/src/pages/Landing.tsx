import React from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { Container, Grid, Typography } from '@mui/material';

const LandingPage: React.FC = () => {
  return (
    <Container component="main" maxWidth="md">
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={5}>
          <SignIn />
        </Grid>
        <Grid item xs={2}>
          <Typography variant="h6" align="center" color="textPrimary">
            - or -
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <SignUp />
        </Grid>
      </Grid>
    </Container>
  );
};

export default LandingPage;
