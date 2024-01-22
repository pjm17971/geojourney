import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, LinearProgress, Typography } from '@mui/material';
import { auth } from '../firebaseconfig';
import { MachineContext } from '../contexts/MachineContext';

const Uploader: React.FC = () => {
  const actorRef = MachineContext.useActorRef();

  const fileUploadStatus = MachineContext.useSelector((snapshot) => {
    return snapshot.context.fileUploadStatus;
  });

  const fileUploadProgress = MachineContext.useSelector((snapshot) => {
    return snapshot.context.fileUploadProgress;
  });

  const fileUploadError = MachineContext.useSelector((snapshot) => {
    return snapshot.context.fileUploadError;
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && auth.currentUser) {
        actorRef.send({ type: 'UPLOAD', file });
      }
    },
    [actorRef],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Box>
      <div
        {...getRootProps()}
        style={{ border: 'dotted', padding: 100, margin: 10, boxSizing: 'border-box' }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <Typography sx={{ height: 50 }} align="center">
            Drop the file here ...
          </Typography>
        ) : (
          <Typography sx={{ height: 50 }} align="center">
            Drag 'n' drop a file here, or click to select a file
          </Typography>
        )}
      </div>

      {fileUploadProgress !== undefined && (
        <Box sx={{ padding: 1 }}>
          <LinearProgress variant="determinate" value={fileUploadProgress ?? 0} />
        </Box>
      )}

      <pre>{`${fileUploadStatus} ${fileUploadProgress?.toFixed(1)} ${fileUploadError}`}</pre>
    </Box>
  );
};

export default Uploader;
