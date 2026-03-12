import { useCallback, useState } from "react";

const STORAGE_KEY = "repomap:recent-projects";
const MAX_ENTRIES = 8;

export interface RecentProject {
  path: string;
  name: string;
  scannedAt: string;
}

function readStorage(): RecentProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentProject[];
  } catch {
    return [];
  }
}

function writeStorage(entries: RecentProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function extractName(path: string): string {
  const segments = path.replace(/[\\/]+$/, "").split(/[\\/]/);
  return segments[segments.length - 1] || path;
}

/** Pure function — safe to call outside React components. */
export function getRecent(): RecentProject[] {
  return readStorage();
}

/** Pure function — safe to call outside React components. */
export function addRecent(path: string): void {
  const existing = readStorage().filter((e) => e.path !== path);
  const entry: RecentProject = {
    path,
    name: extractName(path),
    scannedAt: new Date().toISOString(),
  };
  writeStorage([entry, ...existing].slice(0, MAX_ENTRIES));
}

/** Pure function — safe to call outside React components. */
export function clearRecent(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** React hook for reactive access to recent projects. */
export function useRecentProjects() {
  const [entries, setEntries] = useState<RecentProject[]>(readStorage);

  const refresh = useCallback(() => setEntries(readStorage()), []);

  const add = useCallback((path: string) => {
    addRecent(path);
    setEntries(readStorage());
  }, []);

  const clear = useCallback(() => {
    clearRecent();
    setEntries([]);
  }, []);

  return { entries, add, clear, refresh } as const;
}
