import React from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import {
  Box,
  Progress,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/icons';
import { BsGlobeEuropeAfrica } from 'react-icons/bs';

const CIRCUMFERENCE_EARTH = 40075;

interface DistanceEarthProgressContentProps {
  data: number;
}

const DistanceEarthProgressContent: React.FC<DistanceEarthProgressContentProps> = ({ data }) => {
  const revolutions = (data / 1000) / CIRCUMFERENCE_EARTH;
  const completedRevolutions = Math.floor(revolutions);
  const nextRevolutionCount = completedRevolutions + 1;
  const nextRevolutionPercentage = (revolutions - completedRevolutions) * 100;
  return (
    <VStack w="100%">
      <Icon as={BsGlobeEuropeAfrica} boxSize={14} mb={4} color="green.500" />
      <Progress colorScheme="green" size="lg" value={nextRevolutionPercentage} w="100%" />
      <Box>
        {nextRevolutionPercentage.toFixed(1)}% to complete the distance around earth for the {nextRevolutionCount === 1 ? 'first' : `${nextRevolutionCount}${nextRevolutionCount === 2 ? 'nd' : nextRevolutionCount === 3 ? 'rd' : 'th'}`} time
      </Box>
    </VStack>
  );
};

export const DistanceEarthProgress: React.FC = () => {
  const { data } = useDataQuery('records')
  if (!data) return null;

  return <DistanceEarthProgressContent data={data.totalDistance} />;
};
