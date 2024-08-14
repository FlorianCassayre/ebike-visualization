export interface MissingDataRange {
  range: {
    start: Date;
    end: Date;
  };
  distance: number;
  trips: number;
  altitude: number;
  calories: number;
  time: number; // In hours
}

const createRange = (start: string, end?: string): MissingDataRange['range'] => {
  // Inclusive range, in UTC timezone
  const endDate = new Date(end ?? start);
  endDate.setDate(endDate.getDate() + 1);
  return { start: new Date(start), end: endDate };
};

export const MISSING_DATA: MissingDataRange[] = [
  // Most of this data is estimated/extrapolated using third party sources. The actual figures may be slightly higher/lower than that
  {
    range: createRange('2023-10-20', '2023-11-17'),
    distance: 268_000,
    trips: 103,
    altitude: 2936,
    calories: 6940,
    time: 13.5,
  },
  {
    range: createRange('2024-01-30', '2024-02-04'),
    distance: 37_000,
    trips: 10,
    altitude: 405,
    calories: 958,
    time: 1.8,
  },
  {
    range: createRange('2024-03-15', '2024-03-25'),
    distance: 67_000,
    trips: 18,
    altitude: 734,
    calories: 1735,
    time: 3.4,
  },
  {
    range: createRange('2024-04-18'),
    distance: 7_000,
    trips: 2,
    altitude: 77,
    calories: 181,
    time: 0.3,
  },
  {
    range: createRange('2024-05-18', '2024-05-21'),
    distance: 50_000,
    trips: 11,
    altitude: 548,
    calories: 1295,
    time: 2.5,
  },
];
