export interface Data {
  statisticsDaily: TargetStatistics;
  statisticsMonthly: TargetStatistics;
  records: TargetRecords;
  cumulativeDistance: TargetCumulative;
  cadence: TargetBuckets;
  gears: TargetGears;
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

export type TargetGears = {
  values: TargetBuckets;
  gears: number[];
};
