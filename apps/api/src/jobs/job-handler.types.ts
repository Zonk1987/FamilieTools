export type JobHandlerOwnerType = 'platform' | 'workspace' | 'domain' | 'module-instance';

export type JobHandlerContext = {
  runId: string;
  jobDefinitionId: string;

  ownerType: JobHandlerOwnerType;
  ownerId: string | null;

  attempt: number;

  input: Record<string, unknown>;

  signal: AbortSignal;
};

export type JobHandlerOutput = Record<string, unknown>;

export type JobHandler = (
  context: JobHandlerContext,
) => Promise<JobHandlerOutput | void> | JobHandlerOutput | void;
