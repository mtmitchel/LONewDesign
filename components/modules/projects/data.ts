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

export type ProjectPhase = {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "completed" | "current" | "upcoming";
  completionPercentage: number;
  taskCount?: number;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  status: "completed" | "upcoming" | "at-risk";
  description?: string;
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
    id: "proj-japan-trip",
    name: "Plan Japan trip",
    code: "JPN",
    summary: "Research, plan, and organize a 14-day trip to Japan including Tokyo, Kyoto, and Osaka.",
    dueDate: "2025-06-15",
    progress: 0.35,
    status: "on-track",
    focusArea: "Travel & Leisure",
    lastUpdated: "2025-01-10T14:30:00Z",
    nextStep: "Book flights and JR Pass",
    pinned: true,
  },
  {
    id: "proj-learn-piano",
    name: "Learn to play piano",
    code: "PNO",
    summary: "Master piano fundamentals, music theory, and perform 5 songs by year end.",
    dueDate: "2025-12-31",
    progress: 0.22,
    status: "at-risk",
    focusArea: "Personal Growth",
    lastUpdated: "2025-01-10T09:15:00Z",
    nextStep: "Practice scales for 30 minutes daily",
  },
  {
    id: "proj-python-course",
    name: "Complete Intro to Python Development Course",
    code: "PYT",
    summary: "Finish the comprehensive Python development course covering basics to advanced topics.",
    dueDate: "2025-03-01",
    progress: 0.68,
    status: "on-track",
    focusArea: "Professional Development",
    lastUpdated: "2025-01-10T18:45:00Z",
    nextStep: "Complete Module 8: Object-Oriented Programming",
  },
];

export const phases: ProjectPhase[] = [
  {
    id: "phase-japan-research",
    projectId: "proj-japan-trip",
    name: "Research & planning",
    startDate: "2024-12-01",
    endDate: "2025-01-15",
    status: "completed",
    completionPercentage: 100,
    taskCount: 12,
  },
  {
    id: "phase-japan-booking",
    projectId: "proj-japan-trip",
    name: "Bookings & reservations",
    startDate: "2025-01-16",
    endDate: "2025-03-01",
    status: "current",
    completionPercentage: 35,
    taskCount: 18,
  },
  {
    id: "phase-japan-prep",
    projectId: "proj-japan-trip",
    name: "Pre-trip preparation",
    startDate: "2025-03-02",
    endDate: "2025-06-14",
    status: "upcoming",
    completionPercentage: 0,
    taskCount: 14,
  },
  {
    id: "phase-piano-basics",
    projectId: "proj-learn-piano",
    name: "Foundation & basics",
    startDate: "2024-10-01",
    endDate: "2024-12-31",
    status: "completed",
    completionPercentage: 100,
    taskCount: 15,
  },
  {
    id: "phase-piano-theory",
    projectId: "proj-learn-piano",
    name: "Music theory & reading",
    startDate: "2025-01-01",
    endDate: "2025-04-30",
    status: "current",
    completionPercentage: 28,
    taskCount: 22,
  },
  {
    id: "phase-piano-performance",
    projectId: "proj-learn-piano",
    name: "Performance & repertoire",
    startDate: "2025-05-01",
    endDate: "2025-12-31",
    status: "upcoming",
    completionPercentage: 0,
    taskCount: 20,
  },
  {
    id: "phase-python-fundamentals",
    projectId: "proj-python-course",
    name: "Python fundamentals",
    startDate: "2024-11-01",
    endDate: "2024-12-15",
    status: "completed",
    completionPercentage: 100,
    taskCount: 20,
  },
  {
    id: "phase-python-intermediate",
    projectId: "proj-python-course",
    name: "Intermediate concepts",
    startDate: "2024-12-16",
    endDate: "2025-02-01",
    status: "current",
    completionPercentage: 75,
    taskCount: 25,
  },
  {
    id: "phase-python-advanced",
    projectId: "proj-python-course",
    name: "Advanced topics & project",
    startDate: "2025-02-02",
    endDate: "2025-03-01",
    status: "upcoming",
    completionPercentage: 10,
    taskCount: 16,
  },
];

export const milestones: ProjectMilestone[] = [
  {
    id: "ms-japan-flights",
    projectId: "proj-japan-trip",
    title: "Book roundtrip flights",
    date: "2025-02-01",
    status: "upcoming",
  },
  {
    id: "ms-japan-accommodations",
    projectId: "proj-japan-trip",
    title: "Confirm all hotel bookings",
    date: "2025-02-15",
    status: "upcoming",
  },
  {
    id: "ms-japan-jrpass",
    projectId: "proj-japan-trip",
    title: "Purchase JR Rail Pass",
    date: "2025-04-01",
    status: "upcoming",
  },
  {
    id: "ms-piano-recital",
    projectId: "proj-learn-piano",
    title: "First public performance",
    date: "2025-06-15",
    status: "upcoming",
  },
  {
    id: "ms-piano-sight-reading",
    projectId: "proj-learn-piano",
    title: "Pass sight-reading evaluation",
    date: "2025-02-28",
    status: "at-risk",
  },
  {
    id: "ms-python-midterm",
    projectId: "proj-python-course",
    title: "Complete midterm project",
    date: "2025-01-15",
    status: "completed",
  },
  {
    id: "ms-python-oop",
    projectId: "proj-python-course",
    title: "Finish OOP module",
    date: "2025-01-25",
    status: "upcoming",
  },
];

export const artifacts: ProjectArtifact[] = [
  {
    id: "artifact-japan-itinerary",
    projectId: "proj-japan-trip",
    title: "Day-by-day itinerary draft",
    kind: "note",
    updatedAt: "2025-01-10T14:20:00Z",
  },
  {
    id: "artifact-japan-budget",
    projectId: "proj-japan-trip",
    title: "Trip budget spreadsheet",
    kind: "note",
    updatedAt: "2025-01-09T10:15:00Z",
  },
  {
    id: "artifact-piano-practice-log",
    projectId: "proj-learn-piano",
    title: "Weekly practice log",
    kind: "note",
    updatedAt: "2025-01-10T08:30:00Z",
  },
  {
    id: "artifact-piano-songs",
    projectId: "proj-learn-piano",
    title: "Target song list",
    kind: "note",
    updatedAt: "2025-01-05T16:00:00Z",
  },
  {
    id: "artifact-python-notes",
    projectId: "proj-python-course",
    title: "Module 7 study notes",
    kind: "note",
    updatedAt: "2025-01-10T19:00:00Z",
  },
  {
    id: "artifact-python-project",
    projectId: "proj-python-course",
    title: "Midterm project code review",
    kind: "email",
    updatedAt: "2025-01-08T14:30:00Z",
  },
];

export const threads: ProjectThread[] = [
  {
    id: "thread-japan-tips",
    projectId: "proj-japan-trip",
    title: "Japan travel tips",
    channel: "#travel-japan",
    lastMessageAt: "2025-01-10T12:20:00Z",
  },
  {
    id: "thread-japan-food",
    projectId: "proj-japan-trip",
    title: "Restaurant recommendations",
    channel: "#japan-foodie",
    lastMessageAt: "2025-01-09T18:45:00Z",
  },
  {
    id: "thread-piano-community",
    projectId: "proj-learn-piano",
    title: "Beginner piano community",
    channel: "#piano-learners",
    lastMessageAt: "2025-01-10T07:15:00Z",
  },
  {
    id: "thread-python-help",
    projectId: "proj-python-course",
    title: "Course Q&A thread",
    channel: "#python-course-2025",
    lastMessageAt: "2025-01-10T20:30:00Z",
  },
];

// Mock project task lists removed - now using Google Tasks sync
export const projectTaskLists: ProjectTaskList[] = [];

export const projectTasks: ProjectTask[] = [
  {
    id: "task-japan-flights",
    projectId: "proj-japan-trip",
    listId: "japan-booking",
    title: "Book roundtrip flights",
    priority: "high",
    dueDate: "2025-02-01",
    updatedAt: "2025-01-10T14:30:00Z",
  },
  {
    id: "task-japan-hotels",
    projectId: "proj-japan-trip",
    listId: "japan-booking",
    title: "Reserve hotels in Tokyo, Kyoto, Osaka",
    priority: "high",
    dueDate: "2025-02-15",
    updatedAt: "2025-01-10T13:00:00Z",
  },
  {
    id: "task-japan-jrpass",
    projectId: "proj-japan-trip",
    listId: "japan-planning",
    title: "Research JR Pass options",
    priority: "medium",
    updatedAt: "2025-01-09T16:20:00Z",
  },
  {
    id: "task-japan-visa",
    projectId: "proj-japan-trip",
    listId: "japan-done",
    title: "Check visa requirements",
    updatedAt: "2024-12-20T10:00:00Z",
  },
  {
    id: "task-piano-scales",
    projectId: "proj-learn-piano",
    listId: "piano-practice",
    title: "Practice C major and G major scales",
    priority: "high",
    dueDate: "2025-01-15",
    updatedAt: "2025-01-10T09:15:00Z",
  },
  {
    id: "task-piano-theory",
    projectId: "proj-learn-piano",
    listId: "piano-learning",
    title: "Complete music theory chapter 3",
    priority: "medium",
    updatedAt: "2025-01-09T20:30:00Z",
  },
  {
    id: "task-piano-song1",
    projectId: "proj-learn-piano",
    listId: "piano-learning",
    title: "Learn 'Für Elise' (first section)",
    priority: "medium",
    dueDate: "2025-02-01",
    updatedAt: "2025-01-08T19:00:00Z",
  },
  {
    id: "task-piano-posture",
    projectId: "proj-learn-piano",
    listId: "piano-mastered",
    title: "Master proper hand posture",
    updatedAt: "2024-12-15T14:00:00Z",
  },
  {
    id: "task-python-oop",
    projectId: "proj-python-course",
    listId: "python-progress",
    title: "Complete Module 8: OOP concepts",
    priority: "high",
    dueDate: "2025-01-25",
    updatedAt: "2025-01-10T18:45:00Z",
  },
  {
    id: "task-python-exercises",
    projectId: "proj-python-course",
    listId: "python-progress",
    title: "Finish Module 8 practice exercises",
    priority: "high",
    dueDate: "2025-01-27",
    updatedAt: "2025-01-10T17:30:00Z",
  },
  {
    id: "task-python-final",
    projectId: "proj-python-course",
    listId: "python-todo",
    title: "Plan final project",
    priority: "low",
    updatedAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "task-python-midterm",
    projectId: "proj-python-course",
    listId: "python-complete",
    title: "Submit midterm project",
    updatedAt: "2025-01-15T23:59:00Z",
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

export function getPhasesForProject(projectId: string): ProjectPhase[] {
  return phases
    .filter((phase) => phase.projectId === projectId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
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
