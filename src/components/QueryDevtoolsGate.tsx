import { ComponentType, useEffect, useState } from "react";

type DevtoolsComponent = ComponentType<{ initialIsOpen?: boolean }>;

const QueryDevtoolsGate = () => {
  const [Devtools, setDevtools] = useState<DevtoolsComponent | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let mounted = true;

    import("@tanstack/react-query-devtools")
      .then(({ ReactQueryDevtools }) => {
        if (mounted) {
          setDevtools(() => ReactQueryDevtools);
        }
      })
      .catch(() => {
        // Devtools are optional; ignore failures.
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!import.meta.env.DEV || !Devtools) {
    return null;
  }

  return <Devtools initialIsOpen={false} />;
};

export default QueryDevtoolsGate;

