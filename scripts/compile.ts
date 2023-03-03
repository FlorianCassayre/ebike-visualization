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

const reduceInputStatistics = (data: ResponseActivityRide[]) => ({
  count: data.length,
});

const targetStatisticsDaily = (inputs: ResponseActivityRide[]) => {
  const buckets: Record<string, ResponseActivityRide[]> = {};
  inputs.forEach(input => {
    const key = new Date(parseInt(input.start_time)).toLocaleDateString(LOCALE, { timeZone: TIMEZONE }).split('/').reverse().join('-')
    if (buckets[key] === undefined) {
      buckets[key] = [];
    }
    buckets[key].push(input);
  });
  return Object.fromEntries(Object.entries(buckets)
    .sort(([a,], [b,]) => a < b ? -1 : 1)
    .map(([key, value]) => [key, reduceInputStatistics(value)]));
};

const compile = () => {
  console.log('Loading inputs...');
  const inputs = loadInputs();
  console.log(`${inputs.length} files loaded`);

  const targets = {
    statisticsDaily: targetStatisticsDaily(inputs),
  };

  console.log('Creating targets...');
  writeTargets(targets);
  console.log(`${Object.entries(targets).length} targets created`);
};

void compile();
