import React from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { TargetGears } from '../types/types';
import { Box, Heading, useColorModeValue, useTheme } from '@chakra-ui/react';
import { Area, ComposedChart, CartesianGrid, ResponsiveContainer, Line, XAxis } from 'recharts';

interface GearDistributionContentProps {
  data: TargetGears;
}

const GearDistributionContent: React.FC<GearDistributionContentProps> = ({ data: { values: data, gears } }) => {
  const theme = useTheme();
  const strokeColor = useColorModeValue(theme.colors.orange[500], theme.colors.orange[300]);
  const fillColor = useColorModeValue(theme.colors.orange[200], theme.colors.orange[100]);
  const pointColor = useColorModeValue(theme.colors.orange[700], theme.colors.orange[600]);

  const seriesData = data
    .map((v, i) => [v, gears.includes(i)] as const)
    .filter(([[name]]) => name <= 11)
    .map(([[name, value], gear]) => ({ name, value, gear: gear ? value : undefined }));
  const xTicks = seriesData.map(({ name }) => name).filter(bucket => bucket % 2 === 0);

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3} textAlign="center">
        Gears
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={seriesData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" ticks={xTicks} unit=" m/R" />
          {/*<YAxis unit="%" />*/}
          <Area type="monotone" dataKey="value" stroke={strokeColor} fill={fillColor} />
          <Line type="monotone" dataKey="gear" stroke={pointColor} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const GearDistribution: React.FC = () => {
  const { data } = useDataQuery('gears')
  if (!data) return null;

  return <GearDistributionContent data={data} />;
};
