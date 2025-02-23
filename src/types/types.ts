export interface Data {
  statisticsDaily: TargetStatistics;
  statisticsMonthly: TargetStatistics;
  records: TargetRecords;
  cumulativeDistance: TargetCumulative;
  cadence: TargetBuckets;
  speed: TargetBuckets;
  power: TargetBuckets;
  gears: TargetGears;
  acceleration: TargetAccelerations;
}

export interface TargetStatistics {
  count: number;
  distance: number;
}

export interface TargetRecords {
  totalDistance: number;
  maxSpeed: number;
  totalAltitudeGain: number;
  tripsCount: number;
  totalCalories: number;
  totalOperationTime: number;
}

export type TargetCumulative = [string, number][];

export type TargetBuckets = [number, number][];

export interface TargetGears {
  values: TargetBuckets;
  gears: number[];
  gearDistribution: [number, number, number][];
  speedGearDistribution: { speed: number, values: number[] }[];
}

export type TargetAccelerations = { speed: number, meanAcceleration: number, stdDevAcceleration: number }[];
