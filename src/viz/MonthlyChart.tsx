import { useDataQuery } from '../hooks/useDataQuery';
import React from 'react';
import { TargetStatistics } from '../types/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Box, Heading, Text, useColorModeValue, useTheme } from '@chakra-ui/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthlyChartContentProps {
  data: Record<string, TargetStatistics>;
}

const MonthlyChartContent: React.FC<MonthlyChartContentProps> = ({ data }) => {
  const theme = useTheme();
  const color = useColorModeValue(theme.colors.blue[500], theme.colors.blue[200]);

  const lastMonths = 12;

  const barData = Object.entries(data).map(([key, obj]) => ({ name: key, ...obj, distance: obj.distance / 1000 })).reverse().slice(0, lastMonths).reverse();

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} textAlign="center">
        Monthly distance
      </Heading>
      <Text fontSize="xs" textAlign="center" mb={3}>
        Last {lastMonths} months
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={barData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit=" km" />
          <Bar dataKey="distance" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const MonthlyChart = () => {
  const { data } = useDataQuery('statisticsMonthly');

  if (!data) {
    return null;
  }
  return (
    <MonthlyChartContent data={data} />
  )
};
