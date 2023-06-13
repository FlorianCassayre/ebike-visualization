import React from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { TargetBuckets } from '../types/types';
import { Box, Heading, useColorModeValue, useTheme } from '@chakra-ui/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from 'recharts';

interface CadenceDistributionContentProps {
  data: TargetBuckets;
}

const CadenceDistributionContent: React.FC<CadenceDistributionContentProps> = ({ data }) => {
  const theme = useTheme();
  const strokeColor = useColorModeValue(theme.colors.yellow[500], theme.colors.yellow[300]);
  const fillColor = useColorModeValue(theme.colors.yellow[200], theme.colors.yellow[100]);

  const filtered = data
    .filter(([bucket]) => bucket >= 0)
    .map(([bucket, value]) => ([bucket, bucket > 0 ? value : 0] as const));
  const total = filtered.length > 0 ? filtered.map(([_, value]) => value).reduce((a, b) => a + b) : 0;
  const seriesData = filtered
    .map(([name, value]) => ({ name, value: 100 * value / total }));
  const xTicks = seriesData.map(({ name }) => name).filter(bucket => bucket % 10 === 0);

  return (
    <Box w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3} textAlign="center">
        Pedaling rate
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={seriesData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" ticks={xTicks} unit=" RPM" />
          {/*<YAxis unit="%" />*/}
          <Area type="monotone" dataKey="value" stroke={strokeColor} fill={fillColor} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const CadenceDistribution: React.FC = () => {
  const { data } = useDataQuery('cadence')
  if (!data) return null;

  return <CadenceDistributionContent data={data} />;
};
