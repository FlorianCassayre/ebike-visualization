import React from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { Data, TargetBuckets } from '../types/types';
import { Box, Heading } from '@chakra-ui/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from 'recharts';

interface DistributionContentProps extends Omit<DistributionProps, 'dataKey'> {
  data: TargetBuckets;
}

const DistributionContent: React.FC<DistributionContentProps> = ({ data, heading, unit, strokeColor, fillColor }) => {
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
        {heading}
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={seriesData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" ticks={xTicks} unit={` ${unit}`} />
          {/*<YAxis unit="%" />*/}
          <Area type="monotone" dataKey="value" stroke={strokeColor} fill={fillColor} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

interface DistributionProps {
  dataKey: { [K in keyof Data]: Data[K] extends TargetBuckets ? K : never }[keyof Data];
  heading: string;
  unit: string;
  strokeColor: string;
  fillColor: string;
}

export const Distribution: React.FC<DistributionProps> = ({ dataKey, ...rest }) => {
  const { data } = useDataQuery(dataKey)
  if (!data) return null;

  return <DistributionContent data={data} {...rest} />;
};
