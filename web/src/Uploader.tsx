import React, { useState } from 'react';
import { storage } from './firebaseconfig';
import { auth } from './firebaseconfig';

import { ref as getStorageRef, uploadBytes } from 'firebase/storage';

const Uploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (file && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const imageRef = getStorageRef(storage, `gps_data/${userId}/${file.name}`);
      setUploading(true);
      try {
        await uploadBytes(imageRef, file);
        console.log('File uploaded successfully');
        // Here you could also trigger the Firebase Function or save a reference in Firestore
      } catch (error) {
        console.error('Error uploading file:', error);
      }
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default Uploader;
