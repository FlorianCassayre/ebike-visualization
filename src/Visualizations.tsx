import React from 'react';
import { Records } from './viz/Records';
import { DailyCalendar } from './viz/DailyCalendar';
import { DistanceTimeSeries } from './viz/DistanceTimeSeries';
import { MonthlyChart } from './viz/MonthlyChart';
import { CadenceDistribution } from './viz/CadenceDistribution';
import { GearUsage } from './viz/GearUsage';
import { SpeedGearDistribution } from './viz/SpeedGearDistribution';
import { Grid, GridItem } from '@chakra-ui/react';
import { SpeedDistribution } from './viz/SpeedDistribution';
import { PowerDistribution } from './viz/PowerDistribution';
import { SpeedAccelerationChart } from './viz/SpeedAccelerationChart';

export const Visualizations: React.FC = () => {
  const largeProps = { colSpan: 2 }
  const smallProps = { colSpan: { lg: 1, base: 2 }, overflow: 'hidden' };
  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={{ base: 10, lg: 20 }} mt={3} pt={6}>
      <GridItem {...largeProps}>
        <Records />
      </GridItem>
      <GridItem {...largeProps}>
        <DailyCalendar />
      </GridItem>
      <GridItem {...smallProps}>
        <DistanceTimeSeries />
      </GridItem>
      <GridItem {...smallProps}>
        <MonthlyChart />
      </GridItem>
      <GridItem {...smallProps}>
        <SpeedDistribution />
      </GridItem>
      <GridItem {...smallProps}>
        <CadenceDistribution />
      </GridItem>
      <GridItem {...largeProps}>
        <PowerDistribution />
      </GridItem>
      <GridItem {...largeProps}>
        <SpeedAccelerationChart />
      </GridItem>
      <GridItem {...smallProps}>
        <GearUsage />
      </GridItem>
      <GridItem {...smallProps}>
        <SpeedGearDistribution />
      </GridItem>
    </Grid>
  );
}
