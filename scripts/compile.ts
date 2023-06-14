import fs from 'fs';
import { ResponseActivityRide } from 'ebike-connect-js';

export const LOCALE = 'fr-FR';
export const TIMEZONE = 'Europe/Paris';

const INPUT_DIRECTORY = 'data';
const OUTPUT_DIRECTORY = 'public/data';

const loadInputs = () =>
  fs.readdirSync(INPUT_DIRECTORY)
    .sort()
    .map(filename => fs.readFileSync(`${INPUT_DIRECTORY}/${filename}`, { encoding: 'utf-8' }))
    .map(input => JSON.parse(input) as ResponseActivityRide)
    .sort((a, b) => parseInt(a.start_time) - parseInt(b.start_time));

const writeTargets = (targets: Record<string, object>) => {
  Object.entries(targets).forEach(([name, data]) => {
    const filename = `${name}.json`;
    console.log(`Writing ${filename}`);
    fs.writeFileSync(`${OUTPUT_DIRECTORY}/${filename}`, JSON.stringify(data));
  });
};

const sum = (array: number[]): number => array.length > 0 ? array.reduce((a, b) => a + b) : 0;
const min = (array: number[]): number => array.length > 0 ? array.reduce((a, b) => Math.min(a, b)) : 0;
const max = (array: number[]): number => array.length > 0 ? array.reduce((a, b) => Math.max(a, b)) : 0;

const timestampToIso = (timestamp: string) => new Date(parseInt(timestamp)).toLocaleDateString(LOCALE, { timeZone: TIMEZONE }).split('/').reverse().join('-');

const reduceInputStatistics = (data: ResponseActivityRide[]) => ({
  count: data.length,
  distance: sum(data.map(d => d.total_distance)),
});

const groupStatistics = (inputs: ResponseActivityRide[], groupBy: (ride: ResponseActivityRide) => string) => {
  const buckets: Record<string, ResponseActivityRide[]> = {};
  inputs.forEach(input => {
    const key = groupBy(input);
    if (buckets[key] === undefined) {
      buckets[key] = [];
    }
    buckets[key].push(input);
  });
  return Object.fromEntries(Object.entries(buckets)
    .sort(([a,], [b,]) => a < b ? -1 : 1)
    .map(([key, value]) => [key, reduceInputStatistics(value)]));
};

const targetStatisticsDaily = (inputs: ResponseActivityRide[]) =>
  groupStatistics(inputs, input => timestampToIso(input.start_time));

const targetStatisticsMonthly = (inputs: ResponseActivityRide[]) =>
  groupStatistics(inputs, input => timestampToIso(input.start_time).split('-').slice(0, 2).join('-'));

const targetCumulativeDistance = (inputs: ResponseActivityRide[]) => {
  const array: [string, number][] = [];
  if (inputs.length === 0) {
    return array;
  }
  inputs.forEach(input => {
    const key = timestampToIso(input.start_time);
    if (array.length > 0 && array[array.length - 1][0] === key) {
      array[array.length - 1][1] += input.total_distance;
    } else {
      array.push([key, (array.length > 0 ? array[array.length - 1][1] : 0) + input.total_distance]);
    }
  });
  const lookupTable: Record<string, number> = Object.fromEntries(array);
  const [minDate, maxDate] = [timestampToIso(inputs[0].start_time), timestampToIso(inputs[inputs.length - 1].start_time)];
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
  totalDistance: sum(inputs.map(input => input.total_distance)),
  maxSpeed: max(inputs.map(input => input.max_speed)),
  totalAltitudeGain: sum(inputs.map(input => input.elevation_gain)),
  tripsCount: inputs.length,
  totalCalories: sum(inputs.map(input => input.calories)),
  totalOperationTime: sum(inputs.map(input => parseInt(input.operation_time))),
});

const targetCadence = (inputs: ResponseActivityRide[]) => {
  const cadencesRecord: Record<number, number> = {};
  let total = 0;
  inputs.forEach(({ cadence }) => cadence.forEach(array => array.map(v => v !== null ? v : -1).forEach(v => {
    if (cadencesRecord[v] === undefined) {
      cadencesRecord[v] = 0;
    }
    cadencesRecord[v]++;
    total++;
  })));
  const cadenceBuckets = Object.entries(cadencesRecord).map(([key, value]) => [parseInt(key), value]).map(([key]) => key);
  const mininum = min(cadenceBuckets), maximum = max(cadenceBuckets);
  const result: [number, number][] = [];
  for (let i = mininum; i <= maximum; i++) {
    result.push([i, (cadencesRecord[i] ?? 0) / total]);
  }
  return result;
};

const targetGears = (inputs: ResponseActivityRide[]) => {
  const values: number[] = [];
  inputs.forEach(a => {
    if (a.cadence.length === a.speed.length) {
      a.cadence.forEach((cadences, i) => {
        const speeds = a.speed[i];
        if (cadences.length === speeds.length) {
          cadences.forEach((cadence, j) => {
            const speed = speeds[j];
            if (cadence !== null && speed !== null && cadence > 0 && speed > 0) {
              const speedPerCadence = speed / cadence; // km/h / R/min = m/1000 / R/60
              const metersPerRotation = speedPerCadence * 1000 / 60; // m/R
              values.push(metersPerRotation);
            }
          });
        }
      })
    }
  });
  const step = 0.05;
  const ratiosRecord: Record<number, number> = {};
  values.forEach(value => {
    const key = Math.round(value / step);
    if (ratiosRecord[key] === undefined) {
      ratiosRecord[key] = 0;
    }
    ratiosRecord[key]++;
  });
  const minimum = Math.round(min(values) / step), maximum = Math.round(max(values) / step);
  const result: [number, number][] = [];
  for (let i = minimum; i <= maximum; i++) {
    const bucket = i * step;
    const value = ratiosRecord[i] ?? 0;
    result.push([bucket, value]);
  }
  const slopes: number[] = [];
  for (let i = 0; i < result.length - 1; i++) {
    const dy = result[i + 1][1] - result[i][1];
    const d = dy / step;
    slopes.push(d);
  }
  const radius = 5, decrease = 0.75, maxRatio = 10;
  const means: number[] = [];
  for (let i = 0; i < slopes.length - 1; i++) {
    if (slopes[i] > 0 && slopes[i + 1] < 0
      && (result[i + 1 - radius] === undefined || result[i + 1 - radius][1] < decrease * result[i + 1][1])
      && (result[i + 1 + radius] === undefined || result[i + 1 + radius][1] < decrease * result[i + 1][1])
      && result[i + 1][0] < maxRatio) {
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
  return { values: result, gears, gearDistribution };
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
    gears: targetGears(inputs),
  };

  console.log('Creating targets...');
  writeTargets(targets);
  console.log(`${Object.entries(targets).length} targets created`);
};

void compile();
