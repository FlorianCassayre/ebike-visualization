import React from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { TargetGears } from '../types/types';
import { Box, Heading, useColorModeValue, useTheme } from '@chakra-ui/react';
import { Area, CartesianGrid, ResponsiveContainer, XAxis, AreaChart, YAxis } from 'recharts';
import { list } from 'radash';

interface SpeedGearDistributionContentProps {
  data: TargetGears;
}

const SpeedGearDistributionContent: React.FC<SpeedGearDistributionContentProps> = ({ data: { gears, speedGearDistribution } }) => {
  const theme = useTheme();
  const strokeColor = useColorModeValue(theme.colors.gray[600], theme.colors.gray[300]);

  const seriesData = speedGearDistribution
    .map(({ speed, values }) =>
      ({ ...Object.fromEntries(values.map((value, i) => [i, value * 100])), speed })
    );
  const yTicks = list(0, 5, i => i * 20);

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3} textAlign="center">
        Speed per gear
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={seriesData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="speed" unit=" km/h" minTickGap={15} />
          <YAxis unit="%" ticks={yTicks} domain={[0, 100]} />
          {gears.map((_, i) => (
            <Area key={i} type="monotone" dataKey={i} stackId="1" stroke={strokeColor} fill={theme.colors.red[(10 - i - 1) * 100]} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const SpeedGearDistribution: React.FC = () => {
  const { data } = useDataQuery('gears')
  if (!data) return null;

  return <SpeedGearDistributionContent data={data} />;
};
