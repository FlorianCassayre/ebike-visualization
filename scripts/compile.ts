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
const max = (array: number[]): number => array.length > 0 ? Math.max(...array) : 0;

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

const compile = () => {
  console.log('Loading inputs...');
  const inputs = loadInputs();
  console.log(`${inputs.length} files loaded`);

  const targets = {
    statisticsDaily: targetStatisticsDaily(inputs),
    statisticsMonthly: targetStatisticsMonthly(inputs),
    records: targetRecords(inputs),
    cumulativeDistance: targetCumulativeDistance(inputs),
  };

  console.log('Creating targets...');
  writeTargets(targets);
  console.log(`${Object.entries(targets).length} targets created`);
};

void compile();
