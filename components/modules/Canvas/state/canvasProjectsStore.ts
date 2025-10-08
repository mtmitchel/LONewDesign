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
}

interface CanvasProjectsState {
  projects: CanvasProject[];
  activeId: string | null;
  createProject: (title?: string) => string;
  selectProject: (id: string) => void;
  renameProject: (id: string, title: string) => void;
  touchActiveSnapshot: () => void;
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

const useCanvasProjectsStore = create<CanvasProjectsState>()(
  persist(
    (set, get) => {
      const seedProject: CanvasProject = {
        id: createId(),
        title: 'Untitled canvas',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snapshot: null,
      };

      return {
        projects: [seedProject],
        activeId: seedProject.id,
        createProject: (title?: string) => {
          const stateBefore = get();
          const now = new Date().toISOString();
          if (stateBefore.activeId) {
            const previousSnapshot = captureCanvasSnapshot({ id: stateBefore.activeId, title: stateBefore.projects.find(p => p.id === stateBefore.activeId)?.title });
            set(current => ({
              projects: current.projects.map(project =>
                project.id === stateBefore.activeId
                  ? { ...project, snapshot: previousSnapshot, updatedAt: now }
                  : project
              ),
            }));
          }

          const projectTitle = title ?? getDefaultTitle(get().projects);
          const newProject: CanvasProject = {
            id: createId(),
            title: projectTitle,
            createdAt: now,
            updatedAt: now,
            snapshot: null,
          };

          set(current => ({
            projects: [newProject, ...current.projects],
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
            set(current => ({
              projects: current.projects.map(project =>
                project.id === stateBefore.activeId
                  ? { ...project, snapshot, updatedAt: now }
                  : project
              ),
            }));
          }

          set(current => ({
            projects: current.projects.map(project =>
              project.id === id
                ? { ...project, updatedAt: now }
                : project
            ),
            activeId: id,
          }));

          const next = get().projects.find(project => project.id === id);
          applyCanvasSnapshot(next?.snapshot ?? null);
        },
        renameProject: (id: string, title: string) => {
          set(current => ({
            projects: current.projects.map(project =>
              project.id === id ? { ...project, title, updatedAt: new Date().toISOString() } : project
            ),
          }));
        },
        touchActiveSnapshot: () => {
          const stateNow = get();
          if (!stateNow.activeId) return;
          const snapshot = captureCanvasSnapshot({
            id: stateNow.activeId,
            title: stateNow.projects.find(project => project.id === stateNow.activeId)?.title,
          });
          set(current => ({
            projects: current.projects.map(project =>
              project.id === stateNow.activeId ? { ...project, snapshot, updatedAt: new Date().toISOString() } : project
            ),
          }));
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
