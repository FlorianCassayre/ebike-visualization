import { useQuery } from 'react-query';

export const useDataQuery = <T extends object>(name: string) => useQuery(name, (): Promise<T> => fetch(`/data/${name}.json`).then(r => r.json()));
