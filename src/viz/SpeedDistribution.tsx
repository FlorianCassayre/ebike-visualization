import React from 'react';
import { useColorModeValue, useTheme } from '@chakra-ui/react';
import { Distribution } from './Distribution';

export const SpeedDistribution: React.FC = () => {
  const theme = useTheme();
  const strokeColor = useColorModeValue(theme.colors.yellow[500], theme.colors.yellow[300]);
  const fillColor = useColorModeValue(theme.colors.yellow[200], theme.colors.yellow[100]);

  return <Distribution dataKey="speed" heading="Speed" unit="km/h" strokeColor={strokeColor} fillColor={fillColor} />;
};
