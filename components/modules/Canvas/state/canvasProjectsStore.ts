import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasSnapshot } from './canvasSnapshots';
import { captureCanvasSnapshot, applyCanvasSnapshot, clearCanvasState } from './canvasSnapshots';

interface CanvasProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  snapshot?: CanvasSnapshot | null;
  pinned?: boolean;
}

interface CanvasProjectsState {
  projects: CanvasProject[];
  activeId: string | null;
  createProject: (title?: string) => string;
  selectProject: (id: string) => void;
  renameProject: (id: string, title: string) => void;
  touchActiveSnapshot: () => void;
  togglePinned: (id: string) => void;
  deleteProject: (id: string) => void;
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `canvas-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDefaultTitle(existing: CanvasProject[]) {
  const prefix = 'Untitled canvas';
  const numbers = existing
    .map(project => {
      const match = project.title.startsWith(prefix)
        ? Number.parseInt(project.title.slice(prefix.length).trim(), 10)
        : null;
      return Number.isFinite(match) ? (match as number) : null;
    })
    .filter((value): value is number => value !== null);
  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
  return numbers.length ? `${prefix} ${nextNumber}` : prefix;
}

function sortProjects(projects: CanvasProject[]) {
  return [...projects].sort((a, b) => {
    const pinnedA = a.pinned ? 1 : 0;
    const pinnedB = b.pinned ? 1 : 0;
    if (pinnedA !== pinnedB) {
      return pinnedB - pinnedA;
    }
    const timeA = Date.parse(a.updatedAt ?? '');
    const timeB = Date.parse(b.updatedAt ?? '');
    return timeB - timeA;
  });
}

const useCanvasProjectsStore = create<CanvasProjectsState>()(
  persist(
    (set, get) => {
      const seedProject: CanvasProject = {
        id: createId(),
        title: 'Untitled canvas',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snapshot: null,
        pinned: false,
      };

      return {
        projects: [seedProject],
        activeId: seedProject.id,
        createProject: (title?: string) => {
          const stateBefore = get();
          const now = new Date().toISOString();
          if (stateBefore.activeId) {
            const previousSnapshot = captureCanvasSnapshot({
              id: stateBefore.activeId,
              title: stateBefore.projects.find(p => p.id === stateBefore.activeId)?.title,
            });
            set(current => {
              const updated = current.projects.map(project =>
                project.id === stateBefore.activeId
                  ? { ...project, snapshot: previousSnapshot, updatedAt: now }
                  : project
              );
              return { projects: sortProjects(updated) };
            });
          }

          const projectTitle = title ?? getDefaultTitle(get().projects);
          const newProject: CanvasProject = {
            id: createId(),
            title: projectTitle,
            createdAt: now,
            updatedAt: now,
            snapshot: null,
            pinned: false,
          };

          set(current => ({
            projects: sortProjects([newProject, ...current.projects]),
            activeId: newProject.id,
          }));

          clearCanvasState();
          return newProject.id;
        },
        selectProject: (id: string) => {
          const stateBefore = get();
          if (id === stateBefore.activeId) return;
          const now = new Date().toISOString();
          if (stateBefore.activeId) {
            const snapshot = captureCanvasSnapshot({
              id: stateBefore.activeId,
              title: stateBefore.projects.find(project => project.id === stateBefore.activeId)?.title,
            });
            set(current => {
              const updated = current.projects.map(project =>
                project.id === stateBefore.activeId
                  ? { ...project, snapshot, updatedAt: now }
                  : project
              );
              return { projects: sortProjects(updated) };
            });
          }

          set(current => {
            const updated = current.projects.map(project =>
              project.id === id
                ? { ...project, updatedAt: now }
                : project
            );
            return { projects: sortProjects(updated), activeId: id };
          });

          const next = get().projects.find(project => project.id === id);
          applyCanvasSnapshot(next?.snapshot ?? null);
        },
        renameProject: (id: string, title: string) => {
          const safeTitle = title.trim().length ? title.trim() : getDefaultTitle(get().projects);
          set(current => {
            const updated = current.projects.map(project =>
              project.id === id
                ? { ...project, title: safeTitle, updatedAt: new Date().toISOString() }
                : project
            );
            return { projects: sortProjects(updated) };
          });
        },
        touchActiveSnapshot: () => {
          const stateNow = get();
          if (!stateNow.activeId) return;
          const snapshot = captureCanvasSnapshot({
            id: stateNow.activeId,
            title: stateNow.projects.find(project => project.id === stateNow.activeId)?.title,
          });
          set(current => {
            const updated = current.projects.map(project =>
              project.id === stateNow.activeId
                ? { ...project, snapshot, updatedAt: new Date().toISOString() }
                : project
            );
            return { projects: sortProjects(updated) };
          });
        },
        togglePinned: (id: string) => {
          set(current => {
            const updated = current.projects.map(project =>
              project.id === id
                ? { ...project, pinned: !project.pinned, updatedAt: new Date().toISOString() }
                : project
            );
            return { projects: sortProjects(updated) };
          });
        },
        deleteProject: (id: string) => {
          const stateBefore = get();
          const remaining = stateBefore.projects.filter(project => project.id !== id);

          if (!remaining.length) {
            const now = new Date().toISOString();
            const newProject: CanvasProject = {
              id: createId(),
              title: 'Untitled canvas',
              createdAt: now,
              updatedAt: now,
              snapshot: null,
              pinned: false,
            };
            set({ projects: [newProject], activeId: newProject.id });
            clearCanvasState();
            return;
          }

          const sorted = sortProjects(remaining);
          const nextActiveId = stateBefore.activeId === id ? sorted[0].id : stateBefore.activeId;

          set({
            projects: sorted,
            activeId: nextActiveId ?? null,
          });

          if (stateBefore.activeId === id) {
            const nextProject = sorted[0];
            applyCanvasSnapshot(nextProject?.snapshot ?? null);
          }
        },
      };
    },
    {
      name: 'canvas-projects',
      version: 1,
    }
  )
);

export type { CanvasProject };
export { useCanvasProjectsStore };
