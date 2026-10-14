import { useCallback, useEffect, useState } from "react";
import { checkDependencies } from "./api";
import type { DependenciesStatus } from "../../types";

export function useDependencies() {
  const [status, setStatus] = useState<DependenciesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setStatus(await checkDependencies());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}
