import { useEffect, useState } from 'react';
import { loadData } from '@/lib/data';
import type { DataFile } from '@/lib/data';

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Charge un fichier de données public avec états loading/error. */
export function useData<T>(file: DataFile): DataState<T> {
  const [state, setState] = useState<DataState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });

    loadData<T>(file)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [file]);

  return state;
}
