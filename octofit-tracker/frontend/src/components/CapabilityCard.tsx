import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = { title: string; description: string };
type ResourceProps<T> = Props & {
  path: string;
  emptyMessage: string;
  isEmpty: (data: T) => boolean;
  renderData: (data: T) => React.ReactNode;
};

export function CapabilityCard<T>({ title, description, path, emptyMessage, isEmpty, renderData }: ResourceProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    getJson<T>(path).then((result) => {
      if (active) setData(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    });
    return () => {
      active = false;
    };
  }, [path]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {error !== null
      ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
      : data === null
        ? <p role="status">Loading {title.toLowerCase()}...</p>
        : isEmpty(data)
          ? <p>{emptyMessage}</p>
          : renderData(data)}
  </div></section>;
}
