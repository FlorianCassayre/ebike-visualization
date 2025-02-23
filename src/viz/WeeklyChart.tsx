import { useDataQuery } from '../hooks/useDataQuery';
import React from 'react';
import { TargetStatisticsAggregated } from '../types/types';
import { Bar, BarChart, CartesianGrid, ErrorBar, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Box, Heading, Text, useColorModeValue, useTheme } from '@chakra-ui/react';
import { Z_SCORES } from '../utils';

interface WeeklyChartContentProps {
  data: Record<string, TargetStatisticsAggregated>;
}

const WeeklyChartContent: React.FC<WeeklyChartContentProps> = ({ data }) => {
  const theme = useTheme();
  const color = useColorModeValue(theme.colors.blue[500], theme.colors.blue[200]);
  const errorColor = useColorModeValue(theme.colors.blue[700], theme.colors.blue[50]);

  const percentile = 50 as const;
  const zScore = Z_SCORES[percentile];

  const barData = Object.entries(data).map(([key, obj]) => ({ weekday: key.substring(0, 1), ...obj, meanDistance: obj.meanDistance / 1000, confidenceDistance: zScore * obj.stdDevDistance / 1000 }));

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} textAlign="center">
        Weekly distance
      </Heading>
      <Text fontSize="xs" textAlign="center" mb={3}>
        {percentile}% confidence interval
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={barData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="weekday" />
          <YAxis unit=" km" domain={[0, 'auto']} allowDataOverflow />
          <Bar dataKey="meanDistance" fill={color}>
            <ErrorBar dataKey="confidenceDistance" width={4} strokeWidth={2} stroke={errorColor} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const WeeklyChart = () => {
  const { data } = useDataQuery('statisticsWeekly');

  if (!data) {
    return null;
  }
  return (
    <WeeklyChartContent data={data} />
  )
};
