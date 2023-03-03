import React from 'react';
import './index.css';
import { ChakraProvider } from '@chakra-ui/react'
import { Homepage } from './Homepage';
import { QueryClient, QueryClientProvider } from 'react-query';

export const App = () => {
  const queryClient = new QueryClient();

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <Homepage />
      </QueryClientProvider>
    </ChakraProvider>
  );
};
