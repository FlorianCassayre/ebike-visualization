import {
  Box,
  Code,
  Container,
  Flex,
  Heading,
  IconButton,
  Image,
  Link,
  Spacer,
  useColorMode,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { DailyCalendar } from './viz/DailyCalendar';

export const Homepage = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Container maxW="container.sm" my={{ base: 0, md: 8 }}>
      <Flex alignItems="center">
        <HStack spacing={4}>
          <Image
            width={"15%"}
            src="/logo.svg"
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
      <VStack spacing={4} mt={3} pt={6} height="80vh">
        <Heading as="h1" fontSize={{ base: "3xl", md: "4xl" }}>
          Statistics
        </Heading>
        <Text fontSize={"lg"} align="center">
          My e-bike statistics
        </Text>
        <DailyCalendar />
      </VStack>
    </Container>
  );
};
