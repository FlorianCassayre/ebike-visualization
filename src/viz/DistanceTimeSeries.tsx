import { useDataQuery } from '../hooks/useDataQuery';
import React from 'react';
import { TargetCumulative } from '../types/types';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Box, Heading, useColorModeValue, useTheme } from '@chakra-ui/react';

interface DistanceTimeSeriesContentProps {
  data: TargetCumulative;
}

const DistanceTimeSeriesContent: React.FC<DistanceTimeSeriesContentProps> = ({ data }) => {
  const theme = useTheme();
  const color = useColorModeValue(theme.colors.pink[500], theme.colors.pink[200]);

  const seriesData = data.map(([name, value]) => ({ name: Date.parse(name), value: value / 1000 }));

  const formatXTick = (timestamp: number) => new Date(timestamp).getFullYear().toString();
  const xTicks = seriesData.map(({ name }) => new Date(name)).filter(date => date.getMonth() === 0 && date.getDate() === 1).map(date => date.getTime());

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3} textAlign="center">
        Distance over time
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={seriesData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" ticks={xTicks} tickFormatter={formatXTick} />
          <YAxis unit="km" />
          <Line type="monotone" dataKey="value" stroke={color} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const DistanceTimeSeries = () => {
  const { data } = useDataQuery('cumulativeDistance');

  if (!data) {
    return null;
  }
  return (
    <DistanceTimeSeriesContent data={data} />
  )
};
