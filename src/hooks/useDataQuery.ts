import { useQuery } from 'react-query';
import { Data } from '../types/types';

export const useDataQuery = <K extends keyof Data>(name: K) => useQuery(name, (): Promise<Data[K]> => fetch(`/data/${name}.json`).then(r => r.json()));
