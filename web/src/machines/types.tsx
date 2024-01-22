export type PathPoint = {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
};

export interface Activity {
  id: string;
  name: string;
  duration: number;
  distance: number;
  source: string;
  uploaded: Date;
  path?: PathPoint[];
}

export type EmailPassword = {
  input: { email: string | null; password: string | null };
};
