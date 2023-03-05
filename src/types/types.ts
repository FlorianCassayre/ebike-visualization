export interface Data {
  statisticsDaily: TargetStatistics;
  statisticsMonthly: TargetStatistics;
  records: TargetRecords;
  cumulativeDistance: TargetCumulative;
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
