import { Box } from '@mui/material';

import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { PathPoint } from '../machines/types';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

export type PathMapProps = {
  path: PathPoint[];
};

const ChangeMapView = ({ path }: PathMapProps) => {
  const map = useMap();

  useEffect(() => {
    if (path.length > 0) {
      const coords = path.map((point) => L.latLng(point.lat, point.lon));
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds);
    }
  }, [path, map]);

  return null;
};

export const PathMap = (props: PathMapProps) => {
  const { path } = props;

  const coords = path.map((point) => L.latLng(point.lat, point.lon));

  const center = coords[0]; // Center the map on the first point

  return (
    <Box sx={{ flex: 1, border: 'solid 1px green', height: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%' }}>
        <TileLayer
          url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
          attribution='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
          id="mapbox/outdoors-v11" // Mapbox style ID
          accessToken="pk.eyJ1IjoicGptMTc5NzEiLCJhIjoiY2xybGNxYTN1MGs3ZzJpcGt1MzU4dTUwbSJ9.Yg7GY-RPSwRQ_YVxwlbfEA"
        />
        <Polyline positions={coords} />
        <ChangeMapView path={path} />
      </MapContainer>
    </Box>
  );
};
