"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  clearSession,
  loadSession,
  saveSession,
  type Session,
} from "@/lib/session";

type Listener = () => void;

let memorySession: Session | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function getSnapshot(): Session | null {
  return memorySession;
}

function getServerSnapshot(): Session | null {
  return null;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession() {
  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      memorySession = loadSession();
      hydrated = true;
      emit();
    }
    setReady(true);
  }, []);

  const signIn = useCallback((next: Session) => {
    memorySession = next;
    saveSession(next);
    emit();
  }, []);

  const signOut = useCallback(() => {
    memorySession = null;
    clearSession();
    emit();
  }, []);

  return { session, ready, signIn, signOut };
}
