import React from 'react';
import Uploader from './Uploader';
import Box from '@mui/material/Box';
import { MachineContext } from '../contexts/MachineContext';
import { PathMap } from './PathMap';

const Dashboard: React.FC = () => {
  const actorRef = MachineContext.useActorRef();

  const activities = MachineContext.useSelector((snapshot) => {
    return snapshot.context.activities;
  });

  const selectedActivityId = MachineContext.useSelector((snapshot) => {
    return snapshot.context.selectedActivityId;
  });

  const selectedActivity = MachineContext.useSelector((snapshot) => {
    return snapshot.context.selectedActivity;
  });

  const selectActivity = async (activityId: string) =>
    actorRef.send({ type: 'SELECT_ACTIVITY', activityId });

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
        <Box
          sx={{
            width: '500px',
            border: 'solid 1px red',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid white',
            }}
          >
            <Uploader />
          </Box>
          <Box
            sx={{
              border: '2px solid yellow',
              flex: 1,
            }}
          >
            {activities.map((activity) => {
              return (
                <Box
                  sx={{
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    width: '500px',
                    height: '50px',
                    border: '1px solid grey',
                    margin: '2px',
                    '&:hover': { border: '2px solid white' },
                  }}
                  onClick={() => selectActivity(activity.id)}
                >
                  {activity.name}
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box sx={{ flex: 1, border: 'solid 1px green' }}>
          <h3>{`Activity :: ${selectedActivityId}`}</h3>
          {selectedActivity && selectedActivity.path && <PathMap path={selectedActivity.path} />}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
