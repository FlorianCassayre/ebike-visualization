import { Box, Button, Heading, HStack, IconButton, Tooltip, VStack } from '@chakra-ui/react';
import { useDataQuery } from '../hooks/useDataQuery';
import { TargetStatistics } from '../types/types';
import React, { Fragment, useState } from 'react';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const extractYear = (date: string) => parseInt(date.split('-')[0]);

const colorForDistance = (distance: number) => {
  const colorsAndThresholds: [number, string][] = [[0, 'green'], [10_000, 'teal'], [25_000, 'blue'], [50_000, 'purple']];
  for (let i = colorsAndThresholds.length - 1; i >= 0; i--) {
    const [threshold, color] = colorsAndThresholds[i];
    if (distance >= threshold) {
      return color;
    }
  }
  throw new Error();
};

const makeCalendar = (entries: [string, TargetStatistics][], year: number): ([string, TargetStatistics | null] | undefined)[][] => {
  const filteredEntries = Object.fromEntries(entries.filter(([date,]) => extractYear(date) === year));
  const weekSize = 7;
  const days: ([string, TargetStatistics | null] | undefined)[] = [];
  let date = new Date();
  date.setFullYear(year);
  date.setMonth(0, 1);
  date.setHours(12, 0, 0, 0);
  for (let i = 0; i < (date.getDay() + weekSize - 1) % weekSize; i++) {
    days.push(undefined);
  }
  while (date.getFullYear() === year) {
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const dataDay: TargetStatistics | undefined = filteredEntries[key];
    days.push([key, dataDay ?? null]);
    date.setDate(date.getDate() + 1); // Add one day
  }
  while (days.length % weekSize !== 0) {
    days.push(undefined);
  }
  const transposed: ([string, TargetStatistics | null] | undefined)[][] = [];
  for (let i = 0; i < weekSize; i++) {
    transposed.push([]);
    for (let j = 0; j < Math.floor(days.length / 7); j++) {
      transposed[i].push(days[j * 7 + i]);
    }
  }
  return transposed;
};

const renderButton = (value: [string, TargetStatistics | null] | undefined, now: Date) => {
  if (value === undefined) return <Box p={3} />;
  const [date, stats] = value;
  const dateObj = new Date(date);
  const isNow = dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() === now.getMonth() && dateObj.getDate() === now.getDate();
  return (
    <Tooltip label={<Box textAlign="center">{date}<br/>{`${stats?.count ?? 0} trip${stats?.count === 1 ? '' : 's'}`}<br/>{`${((stats?.distance ?? 0) / 1000).toFixed(1)} km`}</Box>} hasArrow placement="top">
      <Button size="xs" colorScheme={stats !== null ? colorForDistance(stats.distance) : 'gray'} variant={isNow ? 'outline' : undefined} />
    </Tooltip>
  );
};

interface DailyCalendarContentProps {
  data: TargetStatistics;
}

const DailyCalendarContent: React.FC<DailyCalendarContentProps> = ({ data }) => {
  const now = new Date();
  const entries = Object.entries(data).sort(([a,], [b,]) => a < b ? -1 : 1) as [string, TargetStatistics][];
  const years = entries.map(([date,]) => extractYear(date));
  const [minYear, maxYear] = years.length > 0 ? [years[0], years[years.length - 1]] : [now.getFullYear(), now.getFullYear()];

  const [selectedYear, setSelectedYear] = useState(maxYear);
  const [canDecrement, canIncrement] = [minYear < selectedYear, selectedYear < maxYear];

  const calendar = makeCalendar(entries, selectedYear);

  return (
    <VStack spacing={3}>
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }}>
        Activity
      </Heading>
      <VStack spacing={1}>
        {calendar.map((rows, i) => (
          <HStack key={i} spacing={1}>
            <Box width={6} textAlign="center">{WEEKDAYS[i][0]}</Box>
            {rows.map((value, j) => (
              <Fragment key={j}>{renderButton(value, now)}</Fragment>
            ))}
          </HStack>
        ))}
      </VStack>
      <HStack spacing={6}>
        <IconButton icon={<ArrowBackIcon />} aria-label="Previous" disabled={!canDecrement} onClick={() => canDecrement && setSelectedYear(selectedYear - 1)} />
        <Heading as="h2" fontSize={{ base: '2xl' }}>
          {selectedYear}
        </Heading>
        <IconButton icon={<ArrowForwardIcon />} aria-label="Next" disabled={!canIncrement} onClick={() => canIncrement && setSelectedYear(selectedYear + 1)} />
      </HStack>
    </VStack>
  );
};

export const DailyCalendar = () => {
  const { data } = useDataQuery('statisticsDaily');

  if (!data) {
    return null;
  }
  return (
    <DailyCalendarContent data={data} />
  )
};
