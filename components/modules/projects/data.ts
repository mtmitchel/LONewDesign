export type ProjectStatus = "on-track" | "at-risk" | "blocked";

export type Project = {
  id: string;
  name: string;
  code: string;
  summary: string;
  dueDate: string;
  progress: number;
  status: ProjectStatus;
  focusArea: string;
  lastUpdated: string;
  nextStep?: string;
  pinned?: boolean;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  status: "upcoming" | "at-risk";
};

export type ProjectArtifact = {
  id: string;
  projectId: string;
  title: string;
  kind: "note" | "email";
  updatedAt: string;
};

export type ProjectThread = {
  id: string;
  projectId: string;
  title: string;
  channel: string;
  lastMessageAt: string;
};

export type ProjectTaskList = {
  id: string;
  projectId: string;
  name: string;
  order: number;
};

export type ProjectTask = {
  id: string;
  projectId: string;
  listId: string;
  title: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  updatedAt: string;
};

export const projects: Project[] = [
  {
    id: "proj-unified-ui",
    name: "Unified UI redesign",
    code: "UUI",
    summary: "Unify dashboard, assistant, and context surfaces into a calm tri-pane workspace.",
    dueDate: "2025-11-01",
    progress: 0.62,
    status: "on-track",
    focusArea: "Experience design",
    lastUpdated: "2025-10-09T15:00:00Z",
    nextStep: "Polish context panel quick actions",
    pinned: true,
  },
  {
    id: "proj-canvas-ai",
    name: "Canvas AI assist",
    code: "CAN",
    summary: "Blend inline AI tooling for boards with scoped actions and summarization.",
    dueDate: "2025-10-24",
    progress: 0.44,
    status: "at-risk",
    focusArea: "Intelligence",
    lastUpdated: "2025-10-08T21:00:00Z",
    nextStep: "Validate prompt registry coverage",
  },
  {
    id: "proj-ops-enablement",
    name: "Ops enablement launch",
    code: "OPS",
    summary: "Package the onboarding flow and automations for operations teams adopting LibreOllama.",
    dueDate: "2025-12-05",
    progress: 0.78,
    status: "on-track",
    focusArea: "Enablement",
    lastUpdated: "2025-10-07T18:30:00Z",
    nextStep: "Draft rollout announcement",
  },
];

export const milestones: ProjectMilestone[] = [
  {
    id: "ms-uui-context",
    projectId: "proj-unified-ui",
    title: "Context panel adapters online",
    date: "2025-10-15",
    status: "upcoming",
  },
  {
    id: "ms-uui-dashboard",
    projectId: "proj-unified-ui",
    title: "Dashboard widgets wired to new stores",
    date: "2025-10-18",
    status: "upcoming",
  },
  {
    id: "ms-canvas-prompts",
    projectId: "proj-canvas-ai",
    title: "Prompt library verification",
    date: "2025-10-12",
    status: "at-risk",
  },
  {
    id: "ms-ops-training",
    projectId: "proj-ops-enablement",
    title: "Support walkthrough dry-run",
    date: "2025-10-20",
    status: "upcoming",
  },
];

export const artifacts: ProjectArtifact[] = [
  {
    id: "artifact-uui-notes",
    projectId: "proj-unified-ui",
    title: "UX feedback digest",
    kind: "note",
    updatedAt: "2025-10-08T16:20:00Z",
  },
  {
    id: "artifact-uui-email",
    projectId: "proj-unified-ui",
    title: "Client sign-off summary",
    kind: "email",
    updatedAt: "2025-10-07T11:05:00Z",
  },
  {
    id: "artifact-canvas-brief",
    projectId: "proj-canvas-ai",
    title: "AI partner briefing",
    kind: "note",
    updatedAt: "2025-10-06T09:45:00Z",
  },
  {
    id: "artifact-ops-email",
    projectId: "proj-ops-enablement",
    title: "Pilot customer feedback",
    kind: "email",
    updatedAt: "2025-10-05T18:10:00Z",
  },
];

export const threads: ProjectThread[] = [
  {
    id: "thread-uui-design",
    projectId: "proj-unified-ui",
    title: "Design QA check-ins",
    channel: "#project-uui",
    lastMessageAt: "2025-10-09T02:45:00Z",
  },
  {
    id: "thread-uui-feedback",
    projectId: "proj-unified-ui",
    title: "Beta feedback triage",
    channel: "#feedback-uui",
    lastMessageAt: "2025-10-08T21:10:00Z",
  },
  {
    id: "thread-canvas-latency",
    projectId: "proj-canvas-ai",
    title: "Latency spikes investigation",
    channel: "#canvas-ai",
    lastMessageAt: "2025-10-09T05:00:00Z",
  },
  {
    id: "thread-ops-handoff",
    projectId: "proj-ops-enablement",
    title: "Handoff scripting",
    channel: "#ops-launch",
    lastMessageAt: "2025-10-08T14:15:00Z",
  },
];

export const projectTaskLists: ProjectTaskList[] = [
  { id: "uui-backlog", projectId: "proj-unified-ui", name: "Backlog", order: 0 },
  { id: "uui-active", projectId: "proj-unified-ui", name: "Active", order: 1 },
  { id: "uui-review", projectId: "proj-unified-ui", name: "Review", order: 2 },
  { id: "can-backlog", projectId: "proj-canvas-ai", name: "Backlog", order: 0 },
  { id: "can-active", projectId: "proj-canvas-ai", name: "Active", order: 1 },
  { id: "can-testing", projectId: "proj-canvas-ai", name: "Testing", order: 2 },
  { id: "ops-backlog", projectId: "proj-ops-enablement", name: "Backlog", order: 0 },
  { id: "ops-active", projectId: "proj-ops-enablement", name: "Active", order: 1 },
  { id: "ops-ready", projectId: "proj-ops-enablement", name: "Ready to ship", order: 2 },
];

export const projectTasks: ProjectTask[] = [
  {
    id: "task-uui-brief",
    projectId: "proj-unified-ui",
    listId: "uui-active",
    title: "Document context panel adapters",
    priority: "medium",
    dueDate: "2025-10-15",
    updatedAt: "2025-10-09T15:00:00Z",
  },
  {
    id: "task-uui-canvas",
    projectId: "proj-unified-ui",
    listId: "uui-backlog",
    title: "Draft universal search copy",
    updatedAt: "2025-10-08T12:00:00Z",
  },
  {
    id: "task-uui-assistant",
    projectId: "proj-unified-ui",
    listId: "uui-review",
    title: "Review assistant capture summary flow",
    priority: "low",
    updatedAt: "2025-10-07T21:30:00Z",
  },
  {
    id: "task-can-metrics",
    projectId: "proj-canvas-ai",
    listId: "can-active",
    title: "Collect latency telemetry",
    priority: "high",
    dueDate: "2025-10-12",
    updatedAt: "2025-10-08T20:10:00Z",
  },
  {
    id: "task-can-library",
    projectId: "proj-canvas-ai",
    listId: "can-backlog",
    title: "Map prompt library variants",
    updatedAt: "2025-10-07T09:05:00Z",
  },
  {
    id: "task-ops-sequence",
    projectId: "proj-ops-enablement",
    listId: "ops-active",
    title: "Draft onboarding checklist",
    dueDate: "2025-10-20",
    updatedAt: "2025-10-08T13:15:00Z",
  },
  {
    id: "task-ops-handbook",
    projectId: "proj-ops-enablement",
    listId: "ops-backlog",
    title: "Outline support handbook",
    updatedAt: "2025-10-06T18:45:00Z",
  },
];

export function getProjectById(id: string): Project | undefined {
  return projects.find((project) => project.id === id);
}

export function getMilestonesForProject(projectId: string): ProjectMilestone[] {
  return milestones
    .filter((milestone) => milestone.projectId === projectId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
}

export function getArtifactsForProject(projectId: string): ProjectArtifact[] {
  return artifacts
    .filter((artifact) => artifact.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
}

export function getThreadsForProject(projectId: string): ProjectThread[] {
  return threads
    .filter((thread) => thread.projectId === projectId)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .slice(0, 3);
}

export function getTaskListsForProject(projectId: string): ProjectTaskList[] {
  return projectTaskLists
    .filter((list) => list.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

export function getTasksForProject(projectId: string): ProjectTask[] {
  return projectTasks
    .filter((task) => task.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
