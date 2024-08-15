import { useDataQuery } from '../hooks/useDataQuery';
import React from 'react';
import { TargetGears } from '../types/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Box, Heading, useColorModeValue, useTheme } from '@chakra-ui/react';

interface GearUsageContentProps {
  data: TargetGears;
}

const GearUsageContent: React.FC<GearUsageContentProps> = ({ data }) => {
  const theme = useTheme();
  const color = useColorModeValue(theme.colors.orange[500], theme.colors.orange[300]);

  const barData = data.gearDistribution.map(([index, value, weight], i) => ({ name: i + 1, value, percentage: weight * 100 }));

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3} textAlign="center">
        Gears
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={barData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Bar dataKey="percentage" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const GearUsage = () => {
  const { data } = useDataQuery('gears');

  if (!data) {
    return null;
  }
  return (
    <GearUsageContent data={data} />
  )
};
