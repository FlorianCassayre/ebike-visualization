import React, { useMemo } from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { TargetAccelerations } from '../types/types';
import { Box, Heading, Text, useColorModeValue, useTheme } from '@chakra-ui/react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// Percentile to Z-score mapping for some well-known values
const Z_SCORES = {
  50: 0.674,
  95: 1.96,
} as const;

interface SpeedAccelerationChartContentProps {
  data: TargetAccelerations;
}

const SpeedAccelerationChartContent: React.FC<SpeedAccelerationChartContentProps> = ({ data }) => {
  const theme = useTheme();
  const strokeColor = useColorModeValue(theme.colors.purple[500], theme.colors.purple[800]);
  const fillColor = useColorModeValue(theme.colors.purple[200], theme.colors.purple[100]);
  const percentile = 50 as const;
  const zScore = Z_SCORES[percentile];
  const filteredData = useMemo(
    () => data
      .filter(v => 2 <= v.speed)
      .map(({ speed, meanAcceleration, stdDevAcceleration }) => ({ speed, meanAcceleration, confidenceAcceleration: [meanAcceleration - zScore * stdDevAcceleration, meanAcceleration + zScore * stdDevAcceleration] })),
    [data]
  );
  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} textAlign="center">
        Acceleration
      </Heading>
      <Text fontSize="xs" textAlign="center" mb={3}>
        With a {percentile}% confidence interval
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          width={500}
          height={300}
          data={filteredData}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="speed" unit=" km/h" tickFormatter={(v: number) => String(Math.round(v))} />
          <YAxis unit=" /s" domain={[0, 'auto']} allowDataOverflow />
          <Area
            type="monotone"
            dataKey="confidenceAcceleration"
            stroke="none"
            fill={fillColor}
            connectNulls
          />
          <Line type="monotone" dataKey="meanAcceleration" stroke={strokeColor} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}

export const SpeedAccelerationChart: React.FC = () => {
  const { data } = useDataQuery('acceleration')
  if (!data) return null;

  return <SpeedAccelerationChartContent data={data} />;
};
