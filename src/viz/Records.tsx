import React from 'react';
import { TargetRecords } from '../types/types';
import { useDataQuery } from '../hooks/useDataQuery';
import {
  Heading, SimpleGrid,
  Stat,
  StatLabel,
  StatNumber, VStack,
} from '@chakra-ui/react';

interface RecordsContentProps {
  data: TargetRecords;
}

const RecordsContent: React.FC<RecordsContentProps> = ({ data }) => {
  return (
    <VStack w="100%">
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} mb={3}>
        All-time statistics
      </Heading>
      <SimpleGrid columns={[2, null, 3]} gap={6} w="100%" textAlign="center">
          <Stat>
            <StatLabel>Total distance covered</StatLabel>
            <StatNumber>{(data.totalDistance / 1000).toFixed(0)} km</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Maximum speed reached</StatLabel>
            <StatNumber>{data.maxSpeed.toFixed(1)} km/h</StatNumber>
            {/*<StatHelpText>
          <StatArrow type='increase' />
          23.36%
        </StatHelpText>*/}
          </Stat>
          <Stat>
            <StatLabel>Total altitude gained</StatLabel>
            <StatNumber>{(data.totalAltitudeGain / 1000).toFixed(1)} km</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Trips</StatLabel>
            <StatNumber>{data.tripsCount}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Calories spent</StatLabel>
            <StatNumber>{data.totalCalories} kcal</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total time cycling</StatLabel>
            <StatNumber>{Math.floor(data.totalOperationTime / (1000 * 3600))} hours</StatNumber>
          </Stat>
        </SimpleGrid>
    </VStack>
  );
};

export const Records: React.FC = () => {
  const { data } = useDataQuery('records')
  if (!data) return null;

  return <RecordsContent data={data} />;
};
