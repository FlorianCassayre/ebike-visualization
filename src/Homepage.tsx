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
import { BsGithub } from 'react-icons/bs';

export const Homepage = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Container maxW="container.sm" my={{ base: 0, md: 8 }}>
      <Flex alignItems="center">
        <HStack spacing={4}>
          <Image
            width={"15%"}
            src="/icon.svg"
            style={{ pointerEvents: 'none' }}
            my={{ base: 1, md: 0 }}
          />
          <Box fontWeight="bold">
            Florian Cassayre
          </Box>
        </HStack>

        <Spacer />
        <HStack spacing={1}>
          <IconButton
            rounded="full"
            aria-label="GitHub"
            bgColor="transparent"
            icon={<BsGithub />}
            as={'a'}
            href="https://github.com/FlorianCassayre/ebike-visualization"
            target="_blank"
            rel="noopener"
          />
          <IconButton
            rounded="full"
            aria-label="Toggle color mode"
            bgColor="transparent"
            onClick={toggleColorMode}
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          />
        </HStack>
      </Flex>
      <VStack spacing={{ base: 10, lg: 20 }} mt={3} pt={6}>
        <Records />
        <DailyCalendar />
        <DistanceTimeSeries />
        <MonthlyChart />
      </VStack>
    </Container>
  );
};
