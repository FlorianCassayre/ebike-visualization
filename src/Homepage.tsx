import {
  Box,
  Container,
  Flex,
  IconButton,
  Image,
  Spacer,
  useColorMode,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { DailyCalendar } from './viz/DailyCalendar';
import { Records } from './viz/Records';
import { MonthlyChart } from './viz/MonthlyChart';
import { DistanceTimeSeries } from './viz/DistanceTimeSeries';

export const Homepage = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Container maxW="container.sm" my={{ base: 0, md: 8 }}>
      <Flex alignItems="center">
        <HStack spacing={4}>
          <Image
            width={"15%"}
            src="/logo.svg"
            style={{ pointerEvents: 'none' }}
            my={1}
          />
          <Box fontStyle="italic" fontWeight="bold">
            Florian Cassayre
          </Box>
        </HStack>

        <Spacer />
        <IconButton
          rounded="full"
          aria-label="Toggle color mode"
          bgColor="transparent"
          onClick={toggleColorMode}
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        />
      </Flex>
      <VStack spacing={10} mt={3} pt={6}>
        <Records />
        <DailyCalendar />
        <DistanceTimeSeries />
        <MonthlyChart />
      </VStack>
    </Container>
  );
};
