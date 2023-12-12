import React from 'react';
import Uploader from './Uploader';
import Box from '@mui/material/Box';
import { MachineContext } from '../MachineContext';

const Dashboard: React.FC = () => {
  const activities = MachineContext.useSelector((snapshot) => {
    return snapshot.context.activities;
  });

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          width: '100vw',
          height: '60px',
          backgroundColor: '#000000', // or any color you prefer
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          padding: '0 20px', // Add padding on the sides if needed
          boxSizing: 'border-box',
        }}
      >
        {/* Content of the header */}
        <h1 style={{ margin: 0 }}>Paths</h1>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        <Box sx={{ width: '500px', border: 'solid 1px red' }}>
          <Uploader />
        </Box>
        <Box sx={{ flex: 1, border: 'solid 1px green' }}></Box>
        <Box>
          <pre>{JSON.stringify(activities, null, 2)}</pre>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
