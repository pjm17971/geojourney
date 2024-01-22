// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';

// admin.initializeApp();

// exports.processUpload = functions.storage.object().onFinalize(async (object) => {
//     console.log(`New GPX file uploaded: ${object.name} (${object.contentType}`);

//   // Make sure the file is a GPX file
//   if (object.contentType === 'application/gpx+xml') {
//     // TODO: Process the GPX file
//     console.log(`Is GPX file`);

//     // Add your logic here. For example, parsing the GPX file,
//     // storing data in Firestore, or doing some kind of analysis.
//   }
// });

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { parseStringPromise } from 'xml2js';
import { getDistance } from 'geolib';

admin.initializeApp();
const db = admin.firestore();

interface GPXData {
  gpx: {
    trk: Array<{
      name: string[];
      trkseg: Array<{
        trkpt: Array<{
          $: {
            lat: string;
            lon: string;
          };
          ele: string[];
          time: string[];
        }>;
      }>;
    }>;
  };
}

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: Date;
}

exports.processUpload = functions.storage.object().onFinalize(async (object) => {
  // Make sure the file is a GPX file
  if (object.contentType === 'application/gpx+xml' && object.name) {
    // Download the file from Firebase Storage
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const bucket = admin.storage().bucket(fileBucket);
    const file = bucket.file(filePath);

    const contents = await file.download();
    const xml = contents.toString();

    try {
      const result = (await parseStringPromise(xml)) as GPXData;

      // Extracting name, duration, and distance
      const name = result.gpx.trk[0].name[0];
      console.log('Name:', name);

      // Initialize duration and distance
      let duration = 0;
      let distance = 0;
      let lastPoint: TrackPoint | null = null;

      const points: TrackPoint[] = result.gpx.trk[0].trkseg[0].trkpt.map((pt) => ({
        lat: parseFloat(pt.$.lat),
        lon: parseFloat(pt.$.lon),
        ele: parseFloat(pt.ele[0]),
        time: pt.time ? new Date(pt.time[0]) : undefined,
      }));

      // Create a JSON object from the long lat point stream
      const latLongStream = JSON.stringify(points);

      points.forEach((point, index) => {
        if (index > 0 && lastPoint) {
          // Calculate the distance from the last point
          distance += getDistance(
            { latitude: lastPoint.lat, longitude: lastPoint.lon },
            { latitude: point.lat, longitude: point.lon },
          );

          // Calculate the duration from the last timestamp
          if (point.time && lastPoint.time) {
            duration += (point.time.getTime() - lastPoint.time.getTime()) / 1000; // in seconds
          }
        }
        lastPoint = point;
      });

      // Extract the userId from the file path if it's stored in the path, e.g. "userId/gpxfiles/file.gpx"
      const userId = object.name.split('/')[1];

      // Now, create a new document in a subcollection under the userId
      const activityRef = db.collection('users').doc(userId).collection('activities').doc();
      const latLongPath = `streams/${userId}/${activityRef.id}/latlong.json`;

      await activityRef.set({
        name: name,
        duration: duration,
        distance: distance,
        source: object.name, // Stores the path of the uploaded file
        uploaded: admin.firestore.FieldValue.serverTimestamp(), // Adds a server-side timestamp to the document
        latlong: latLongPath,
      });

      // Save out streams to cloud storage for the different timeseries
      const latLong = bucket.file(latLongPath);
      await latLong.save(latLongStream, {
        metadata: {
          contentType: 'application/json',
        },
      });
    } catch (err) {
      console.error('Failed to parse GPX:', err);
      // Handle errors appropriately
    }
  }
});
