import React from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

const LandingPage: React.FC = () => {
  return (
    <div>
      <h1>Your GeoJourney begins here.</h1>
      <SignIn />
      or
      <SignUp />
    </div>
  );
};

export default LandingPage;
