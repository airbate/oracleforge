"use client";

import { useEffect, useState } from "react";
import {
  fetchSignals,
  fetchPositions,
  fetchForumLog,
  fetchSettings,
} from "@/lib/api";
import type { Signal, Position, ForumMessage, SettingsState } from "@/types";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

export function useSignals() {
  const [state, setState] = useState<AsyncState<Signal[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchSignals()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function usePositions() {
  const [state, setState] = useState<AsyncState<Position[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchPositions()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useForum() {
  const [state, setState] = useState<AsyncState<ForumMessage[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchForumLog()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useSettings() {
  const [state, setState] = useState<AsyncState<SettingsState | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
