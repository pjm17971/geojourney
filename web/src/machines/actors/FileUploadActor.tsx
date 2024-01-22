import { fromCallback } from 'xstate';
import { storage } from '../../firebaseconfig';
import {
  StorageError,
  UploadTask,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { User } from 'firebase/auth';

/**
 * Service to interface with firebase storage uploads. The service takes the current
 * user and upload file from context and begins a resumable upload using `uploadBytesResumable`.
 */
export type FileUploadEvents =
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_STATUS'; status: string }
  | { type: 'UPLOAD_FAILED'; error: StorageError }
  | { type: 'UPLOAD_COMPLETED'; url: string };

export type FileUploadActorArg = {
  sendBack: (event: FileUploadEvents) => void;
  input: {
    user: User | null;
    file: File | null;
  };
};

export const fileUploadActor = fromCallback(({ sendBack, input }: FileUploadActorArg) => {
  const { user, file } = input;
  let uploader: UploadTask;
  if (user && file) {
    const userId = (user as User).uid;
    const metadata = {
      contentType: 'application/gpx+xml',
    };
    const imageRef = ref(storage, `gps_data/${userId}/${file.name}`);
    uploader = uploadBytesResumable(imageRef, file, metadata);
    uploader.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        sendBack({ type: 'UPLOAD_PROGRESS', progress });
        sendBack({ type: 'UPLOAD_STATUS', status: snapshot.state });
      },
      (error) => {
        sendBack({ type: 'UPLOAD_FAILED', error });
      },
      () => {
        getDownloadURL(uploader.snapshot.ref).then((downloadURL) => {
          sendBack({ type: 'UPLOAD_COMPLETED', url: downloadURL });
        });
      },
    );
  }
  return () => {
    if (uploader) {
      uploader.cancel();
    }
  };
});
