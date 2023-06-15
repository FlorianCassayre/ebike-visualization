import fs from 'fs';
import { ResponseActivityRide } from 'ebike-connect-js';
import * as _ from 'radash';

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

const reduceInputStatistics = (data: ResponseActivityRide[]) => ({
  count: data.length,
  distance: _.sum(data, d => d.total_distance),
});

const groupStatistics = (inputs: ResponseActivityRide[], groupBy: (ride: ResponseActivityRide) => string) =>
  Object.fromEntries(
    _.alphabetical(Object.entries(_.group(inputs, groupBy)), ([a]) => a)
      .map(([key, value]) => [key, reduceInputStatistics(value!)])
  );

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
  totalDistance: _.sum(inputs, input => input.total_distance),
  maxSpeed: _.max(inputs.map(input => input.max_speed)) ?? 0,
  totalAltitudeGain: _.sum(inputs, input => input.elevation_gain),
  tripsCount: inputs.length,
  totalCalories: _.sum(inputs, input => input.calories),
  totalOperationTime: _.sum(inputs, input => parseInt(input.operation_time)),
});

const targetCadence = (inputs: ResponseActivityRide[]) => {
  const values = inputs.flatMap(({ cadence }) => cadence.flatMap(array => array.map(v => v !== null ? v : -1)));
  const cadencesRecord = _.counting(values, v => v);
  const cadenceBuckets = _.keys(cadencesRecord).map(key => parseInt(key));
  return _.list(_.min(cadenceBuckets) ?? 0, _.max(cadenceBuckets) ?? 0, i => [i, (cadencesRecord[i] ?? 0) / values.length]);
};

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
