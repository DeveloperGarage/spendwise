export type ActivityActor = {
  id: string;
  displayName: string;
};

export type ActivityItem = {
  id: string;
  at: string;
  actor: ActivityActor;
  kind: string;
  action: string;
  subjectId: string;
  snapshot: Record<string, unknown>;
};

export type GroupActivity = {
  activities: ActivityItem[];
  nextCursor: string | null;
};