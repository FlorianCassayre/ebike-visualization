import {
  Box,
  Container,
  Flex,
  IconButton,
  Image,
  Spacer,
  useColorMode,
  HStack,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { BsGithub } from 'react-icons/bs';
import { lazily } from 'react-lazily';
import React, { Suspense } from 'react';

const { Visualizations } = lazily(() => import('./Visualizations'));

export const Homepage = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Container maxW="container.xl" my={{ base: 0, md: 8 }}>
      <Flex alignItems="center">
        <HStack spacing={4}>
          <Image
            width={"15%"}
            src="/icon.svg"
            style={{ pointerEvents: 'none' }}
            my={{ base: 3, md: 0 }}
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

      <Suspense
        fallback={
          <Center>
            <Spinner size="xl" mt={16} mb={8} />
          </Center>
        }
      >
        <Visualizations />
      </Suspense>
    </Container>
  );
};
