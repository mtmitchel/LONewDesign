export type ProjectStatus = "on-track" | "at-risk" | "blocked";

export type Project = {
  id: string;
  name: string;
  code: string;
  summary: string;
  lead: string;
  team: string[];
  dueDate: string;
  progress: number;
  status: ProjectStatus;
  focusArea: string;
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
  owner: string;
  updatedAt: string;
};

export type ProjectThread = {
  id: string;
  projectId: string;
  title: string;
  channel: string;
  lastMessageAt: string;
};

export const projects: Project[] = [
  {
    id: "proj-unified-ui",
    name: "Unified UI redesign",
    code: "UUI",
    summary: "Orchestrate dashboard, assistant, and context surfaces into a cohesive tri-pane experience.",
    lead: "Mason Rivera",
    team: ["Mason", "Priya", "Alex", "Devon"],
    dueDate: "2025-11-01",
    progress: 0.62,
    status: "on-track",
    focusArea: "Experience design",
    pinned: true,
  },
  {
    id: "proj-canvas-ai",
    name: "Canvas AI assist",
    code: "CAN",
    summary: "Blend inline AI tooling for collaborative boards with scoped actions and summarization.",
    lead: "Priya Patel",
    team: ["Priya", "Alex", "Naomi"],
    dueDate: "2025-10-24",
    progress: 0.44,
    status: "at-risk",
    focusArea: "Intelligence",
  },
  {
    id: "proj-ops-enablement",
    name: "Ops enablement launch",
    code: "OPS",
    summary: "Package the onboarding flow and automations for operations teams adopting LibreOllama.",
    lead: "Devon Clarke",
    team: ["Devon", "Mason", "Ivy"],
    dueDate: "2025-12-05",
    progress: 0.78,
    status: "on-track",
    focusArea: "Enablement",
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
    owner: "Priya Patel",
    updatedAt: "2025-10-08T16:20:00Z",
  },
  {
    id: "artifact-uui-email",
    projectId: "proj-unified-ui",
    title: "Client sign-off summary",
    kind: "email",
    owner: "Alex Chen",
    updatedAt: "2025-10-07T11:05:00Z",
  },
  {
    id: "artifact-canvas-brief",
    projectId: "proj-canvas-ai",
    title: "AI partner briefing",
    kind: "note",
    owner: "Naomi Lee",
    updatedAt: "2025-10-06T09:45:00Z",
  },
  {
    id: "artifact-ops-email",
    projectId: "proj-ops-enablement",
    title: "Pilot customer feedback",
    kind: "email",
    owner: "Ivy Doyle",
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
