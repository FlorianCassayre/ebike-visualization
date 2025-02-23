import fs from 'fs';
import { ResponseActivityRide } from 'ebike-connect-js';
import * as _ from 'radash';
import { MISSING_DATA, MissingDataRange } from '../src/config';

export const LOCALE = 'fr-FR';
export const TIMEZONE = 'Europe/Paris';

const INPUT_DIRECTORY = 'data';
const OUTPUT_DIRECTORY = 'public/data';

const loadInputs = () =>
  _.sort(
    fs.readdirSync(INPUT_DIRECTORY)
      .sort()
      .map(filename => fs.readFileSync(`${INPUT_DIRECTORY}/${filename}`, { encoding: 'utf-8' }))
      .map(input => JSON.parse(input) as ResponseActivityRide),
    a => parseInt(a.start_time)
  );

const writeTargets = (targets: Record<string, object>) => {
  Object.entries(targets).forEach(([name, data]) => {
    const filename = `${name}.json`;
    console.log(`Writing ${filename}`);
    fs.writeFileSync(`${OUTPUT_DIRECTORY}/${filename}`, JSON.stringify(data));
  });
};

const timestampToIso = (timestamp: string) => new Date(parseInt(timestamp)).toLocaleDateString(LOCALE, { timeZone: TIMEZONE }).split('/').reverse().join('-');

const getMissingDataDays = (data: MissingDataRange[]): (Omit<MissingDataRange, 'range'> & { date: Date })[] =>
  data.flatMap(({ range: { start, end }, distance, trips, altitude, calories, time }) => {
    const dates: Date[] = [];
    const endTimestamp = timestampToIso(String(end.getTime()));
    let date = timestampToIso(String(start.getTime()));
    while (date < endTimestamp) {
      dates.push(new Date(date));
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      date = timestampToIso(String(nextDate.getTime()));
    }
    const t = dates.length;
    return dates.map((d) => ({ date: d, distance: distance / t, trips: trips / t, altitude: altitude / t, calories: calories / t, time: time / t }));
  });

const reduceInputStatistics = (data: ResponseActivityRide[], missingData: ReturnType<typeof getMissingDataDays>) => ({
  count: data.length,
  distance: _.sum(data, d => d.total_distance) + _.sum(missingData, d => d.distance),
});

const groupStatistics = (inputs: ResponseActivityRide[], groupBy: (date: string) => string) => {
  const grouped = _.group(inputs, ride => groupBy(ride.start_time));
  const missing = _.group(getMissingDataDays(MISSING_DATA), d => groupBy(String(d.date.getTime())));
  const sortedKeys = Array.from(new Set([...Object.keys(grouped), ...Object.keys(missing)])).sort();
  return Object.fromEntries(
    sortedKeys.map(key => [key, reduceInputStatistics(grouped[key] ?? [], missing[key] ?? [])])
  );
};

const groupDistribution = (inputs: ResponseActivityRide[], groupBy: (ride: ResponseActivityRide) => number[], step: number) => {
  const values = inputs.flatMap(groupBy);
  const record = _.counting(values, v => Math.round(v / step));
  const buckets = _.keys(record).map(key => parseInt(key));
  return _.list(_.min(buckets) ?? 0, _.max(buckets) ?? 0, i => [i * step, (record[i] ?? 0) / values.length]);
};

const targetStatisticsDaily = (inputs: ResponseActivityRide[]) =>
  groupStatistics(inputs, date => timestampToIso(date));

const targetStatisticsMonthly = (inputs: ResponseActivityRide[]) =>
  groupStatistics(inputs, date => timestampToIso(date).split('-').slice(0, 2).join('-'));

const targetCumulativeDistance = (inputs: ResponseActivityRide[]) => {
  const daily = Object.entries(targetStatisticsDaily(inputs));
  const array: [string, number][] = [];
  if (daily.length === 0) {
    return array;
  }
  daily.forEach(([key, { distance }]) => {
    if (array.length > 0 && array[array.length - 1][0] === key) {
      array[array.length - 1][1] += distance;
    } else {
      array.push([key, (array.length > 0 ? array[array.length - 1][1] : 0) + distance]);
    }
  });
  const lookupTable: Record<string, number> = Object.fromEntries(array);
  const [minDate, maxDate] = [daily[0][0], daily[daily.length - 1][0]];
  let currentDate = minDate;
  const resultArray: [string, number][] = [];
  while (currentDate <= maxDate) {
    if (lookupTable[currentDate] === undefined) {
      const previousValue = resultArray[resultArray.length - 1][1];
      resultArray.push([currentDate, previousValue]);
    } else {
      resultArray.push([currentDate, lookupTable[currentDate]]);
    }
    // Next date
    const date = new Date(Date.parse(currentDate));
    date.setDate(date.getDate() + 1);
    currentDate = timestampToIso(String(date.getTime()));
  }
  return resultArray;
};

const targetRecords = (inputs: ResponseActivityRide[]) => ({
  totalDistance: _.sum(inputs, input => input.total_distance) + _.sum(MISSING_DATA, d => d.distance),
  maxSpeed: _.max(inputs.map(input => input.max_speed)) ?? 0,
  totalAltitudeGain: _.sum(inputs, input => input.elevation_gain) + _.sum(MISSING_DATA, d => d.altitude),
  tripsCount: inputs.length + _.sum(MISSING_DATA, d => d.trips),
  totalCalories: _.sum(inputs, input => input.calories) + _.sum(MISSING_DATA, d => d.calories),
  totalOperationTime: _.sum(inputs, input => parseInt(input.operation_time)) + _.sum(MISSING_DATA, d => d.time * 60 * 60 * 1000),
});

const targetCadence = (inputs: ResponseActivityRide[]) =>
  groupDistribution(inputs, ({ cadence }) => cadence.flatMap(array => array.map(v => v !== null ? v : -1)), 1);

const targetSpeed = (inputs: ResponseActivityRide[]) =>
  groupDistribution(inputs, ({ speed }) => speed.flatMap(array => array.map(v => v !== null ? v : -1)), 1);

const targetPower = (inputs: ResponseActivityRide[]) =>
  groupDistribution(inputs, ({ power_output }) => power_output.flatMap(array => array.map(v => v !== null ? v : -1)), 5);

const targetGears = (inputs: ResponseActivityRide[]) => {
  const values = inputs
    .filter(a => a.cadence.length === a.speed.length)
    .flatMap(a =>
      _.zip(a.cadence, a.speed)
        .filter(([cadences, speeds]) => cadences.length === speeds.length)
        .flatMap(([cadences, speeds]) =>
          _.zip(cadences, speeds)
            .filter(([cadence, speed]) => cadence !== null && speed !== null && cadence > 0 && speed > 0)
            .map(([cadence, speed]) => {
              const speedPerCadence = speed / cadence!; // km/h / R/min = m/1000 / R/60
              const metersPerRotation = speedPerCadence * 1000 / 60; // m/R
              return { metersPerRotation, speed, cadence: cadence! };
            })
        )
    );
  const metersPerRotations = values.map(o => o.metersPerRotation);
  const step = 0.05;
  const ratiosRecord = _.counting(metersPerRotations, value => Math.round(value / step));
  const minimum = Math.round((_.min(metersPerRotations) ?? 0) / step), maximum = Math.round((_.max(metersPerRotations) ?? 0) / step);
  const result = _.list(minimum, maximum, i => {
    const bucket = i * step;
    const value = ratiosRecord[i] ?? 0;
    return [bucket, value];
  });
  const slopes = _.zip(result.slice(0, result.length - 1), result.slice(1)).map(([[, v0], [, v1]]) => (v1 - v0) / step)
  const radius = 5, decrease = 0.75, minRatio = 2, maxRatio = 10;
  const means: number[] = [];
  for (let i = 0; i < slopes.length - 1; i++) {
    if (slopes[i] > 0 && slopes[i + 1] < 0
      && (result[i + 1 - radius] === undefined || result[i + 1 - radius][1] < decrease * result[i + 1][1])
      && (result[i + 1 + radius] === undefined || result[i + 1 + radius][1] < decrease * result[i + 1][1])
      && minRatio < result[i + 1][0] && result[i + 1][0] < maxRatio) {
      means.push(i + 1);
    }
  }
  if (means.length > 20) {
    throw new Error();
  }
  const classifiedGears: number[] = [];
  const closestTo = (i: number): [number, number][] => means.map<[number, number]>((mean, id) => [id, Math.abs(i - mean)]).sort(([, a], [, b]) => a - b);
  for (let i = 0; i < result.length; i++) {
    const closest = closestTo(i)[0][0];
    classifiedGears.push(closest);
  }
  const classifiedGearsClean: (number | null)[] = [];
  const maxRadiusSymmetry = 1.2;
  for (let i = 0; i < result.length; i++) {
    const closest = closestTo(i);
    if (closest[0][0] === classifiedGears[i] && ((i <= means[classifiedGears[i]]) === (i <= means[closest[1][0]])) && closest[1][1] < closest[0][1] * 2 * maxRadiusSymmetry) {
      classifiedGearsClean.push(null);
    } else {
      classifiedGearsClean.push(classifiedGears[i]);
    }
  }
  let total = 0;
  const gearsCounts: Record<number, number> = {};
  for (let i = 0; i < result.length; i++) {
    const gear = classifiedGearsClean[i];
    if (gear !== null) {
      const key = means[gear];
      if (gearsCounts[key] === undefined) {
        gearsCounts[key] = 0;
      }
      const value = result[i][1];
      gearsCounts[key] += value;
      total += value;
    }
  }
  const gearDistribution = means.map(key => [key, result[key][0], (gearsCounts[key] ?? 0) / total] as const);
  const gears = means.sort();
  const speedStep = 0.5;
  const speedGroups = _.group(values, o => Math.round(o.speed / speedStep));
  const speedKeys = _.keys(speedGroups).map(v => parseInt(v));
  const speedGearDistribution =
    _.list(_.min(speedKeys) ?? 0, _.max(speedKeys) ?? 0, speedKey => [speedKey * speedStep, speedGroups[speedKey] ?? []] satisfies [number, typeof values])
      .map(([speed, items]) => {
        const gearsGroups = _.counting(items, o => classifiedGearsClean[Math.round(o.metersPerRotation / step) - minimum] ?? -1);
        const gearsVector = _.list(gears.length - 1).map(i => gearsGroups[i] ?? 0);
        const totalInGroup = _.sum(gearsVector);
        const normalizedVector = gearsVector.map((v, i) => totalInGroup !== 0 ? v / totalInGroup : (i === gears.length - 1 ? 1 : 0));
        return { speed: speed, values: normalizedVector };
      });
  return { values: result, gears, gearDistribution, speedGearDistribution };
};

const computeMeanStdDev = (values: number[]): { mean: number, stdDev: number } => {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0 };
  const mean = _.sum(values) / n;
  const variance = _.sum(values.map(value => (value - mean) ** 2)) / (n - 1);
  return {
    mean,
    stdDev: Math.sqrt(variance)
  };
};


const targetAcceleration = (inputs: ResponseActivityRide[]) => {
  const stepRadius = 1;
  const speedsAndAccelerations: { speed: number, acceleration: number }[] = [];
  inputs.forEach(input => {
    const duration = parseInt(input.end_time) - parseInt(input.start_time);
    if (duration === 0 || input.speed.length !== 1) {
      return;
    }
    const speeds = input.speed[0];
    if (speeds.length < 2 * stepRadius + 1) {
      return;
    }
    const dtSingleSecond = duration / (1000 * speeds.length); // In seconds
    if (Math.abs(dtSingleSecond - 1) > 0.05) { // Data points occur every second, we tolerate a 5% error
      return;
    }
    const dt = (2 * stepRadius) * dtSingleSecond;
    for (let i = stepRadius; i < speeds.length - stepRadius; i++) {
      const speedBefore = speeds[i - stepRadius], speed = speeds[i], speedAfter = speeds[i + stepRadius];
      const acceleration = (speedAfter - speedBefore) / dt;
      speedsAndAccelerations.push({ speed, acceleration: Math.abs(acceleration) });
    }
  });
  //const accelerations = speedsAndAccelerations.map(v => v.acceleration);
  //const minAcceleration = _.min(accelerations) || 0, maxAcceleration = _.max(accelerations) || 0;
  const maxSpeed = _.max(speedsAndAccelerations.map(v => v.speed)) || 0;
  const totalPoints = 50;
  const speedBuckets: number[][] = _.list(0, totalPoints - 1, () => []);
  speedsAndAccelerations.forEach(({ speed, acceleration }) => {
    const bucket = Math.min(Math.floor(totalPoints * speed / maxSpeed), totalPoints - 1);
    speedBuckets[bucket].push(acceleration);
  });
  return _.list(0, totalPoints - 1, bucket => {
    const { mean, stdDev } = computeMeanStdDev(speedBuckets[bucket]);
    return {
      speed: bucket * maxSpeed / totalPoints,
      meanAcceleration: mean,
      stdDevAcceleration: stdDev,
    };
  });
};

const compile = () => {
  console.log('Loading inputs...');
  const inputs = loadInputs();
  console.log(`${inputs.length} files loaded`);

  const targets = {
    statisticsDaily: targetStatisticsDaily(inputs),
    statisticsMonthly: targetStatisticsMonthly(inputs),
    records: targetRecords(inputs),
    cumulativeDistance: targetCumulativeDistance(inputs),
    cadence: targetCadence(inputs),
    speed: targetSpeed(inputs),
    power: targetPower(inputs),
    gears: targetGears(inputs),
    acceleration: targetAcceleration(inputs),
  };

  console.log('Creating targets...');
  writeTargets(targets);
  console.log(`${Object.entries(targets).length} targets created`);
};

void compile();
