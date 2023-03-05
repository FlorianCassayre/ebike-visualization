import { useDataQuery } from '../hooks/useDataQuery';
import React from 'react';
import { TargetStatistics } from '../types/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Box, Heading, useColorModeValue, useTheme } from '@chakra-ui/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthlyChartContentProps {
  data: TargetStatistics;
}

const MonthlyChartContent: React.FC<MonthlyChartContentProps> = ({ data }) => {
  const theme = useTheme();
  const color = useColorModeValue(theme.colors.blue[500], theme.colors.blue[200]);

  const barData = Object.entries(data).map(([key, obj]) => ({ name: key, ...obj, distance: obj.distance / 1000 })).reverse().slice(0, 12).reverse();

  return (
    <Box>
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3} textAlign="center">
        Monthly distance
      </Heading>
      <BarChart
        width={700}
        height={300}
        data={barData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis unit="km" />
        <Bar dataKey="distance" fill={color} />
      </BarChart>
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
