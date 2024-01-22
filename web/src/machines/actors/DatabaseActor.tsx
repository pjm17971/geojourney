import { fromCallback } from 'xstate';
import { db, storage } from '../../firebaseconfig';
// import { ref, getDownloadURL } from 'firebase/storage';
import { User } from 'firebase/auth';
import {
  DocumentSnapshot,
  Unsubscribe,
  collection,
  doc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { Activity, PathPoint } from '../types';
import { getDownloadURL, ref } from 'firebase/storage';

export type DatabaseActorEmitedEvents =
  | { type: 'ACTIVITIES_UPDATE'; activities: Activity[] }
  | { type: 'ACTIVITY_UPDATE'; activity: Activity };
export type DatabaseActorEvents = { type: 'ACTIVITY_SUBSCRIBE'; activityId: string };
export type DatabaseInput = { user: User | null };
type DatabaseActorEmitter = (event: DatabaseActorEmitedEvents) => void;

const createActivityFromDoc = (doc: DocumentSnapshot): Activity => {
  const rawActivity = doc.data()!;
  const activityId = doc.id;

  const activity: Activity = {
    id: activityId,
    name: rawActivity.name,
    duration: rawActivity.duration,
    distance: rawActivity.distance,
    source: rawActivity.source,
    uploaded: new Date(rawActivity.uploaded),
    path: [],
  };

  return activity;
};

const createActivityWithPath = async (user: User, doc: DocumentSnapshot): Promise<Activity> => {
  const rawActivity = doc.data()!;
  const activityId = doc.id;

  const points = await fetchPoints(user, activityId);

  const activity: Activity = {
    id: activityId,
    name: rawActivity.name,
    duration: rawActivity.duration,
    distance: rawActivity.distance,
    source: rawActivity.source,
    uploaded: new Date(rawActivity.uploaded),
    path: points,
  };

  return activity;
};

const fetchPoints = async (user: User, activityId: string): Promise<PathPoint[]> => {
  const storageRef = ref(storage, `streams/${user.uid}/${activityId}/latlong.json`);
  const url = await getDownloadURL(storageRef);
  const response = await fetch(url);
  const data: PathPoint[] = await response.json();
  return data;
};

export const databaseActor = fromCallback<DatabaseActorEvents, DatabaseInput>(
  ({ receive, sendBack, input }) => {
    console.log('XXXXXXXXX STARTING databaseActor');

    const { user } = input;

    const emit: DatabaseActorEmitter = sendBack;

    let activitiesUnsubscribe: Unsubscribe;
    let activityUnsubscribe: Unsubscribe;

    if (user) {
      const ref = collection(db, 'users', user.uid, 'activities');
      const q = query(ref);
      activitiesUnsubscribe = onSnapshot(q, async (querySnapshot) => {
        const activities: Activity[] = [];
        querySnapshot.forEach((doc) => {
          activities.push(createActivityFromDoc(doc));
        });
        emit({ type: 'ACTIVITIES_UPDATE', activities });
      });
    }

    receive((event) => {
      if (user) {
        if (event.type === 'ACTIVITY_SUBSCRIBE') {
          const { activityId } = event;

          // Get the activity whenever it changes
          const docRef = doc(db, 'users', user.uid, 'activities', activityId);
          activityUnsubscribe = onSnapshot(docRef, async (doc) => {
            const activity = await createActivityWithPath(user, doc);
            emit({ type: 'ACTIVITY_UPDATE', activity });
          });
        }
      }
    });

    return () => {
      if (activitiesUnsubscribe) {
        activitiesUnsubscribe();
      }
      if (activityUnsubscribe) {
        activityUnsubscribe();
      }
    };
  },
);
