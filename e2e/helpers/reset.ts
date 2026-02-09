export type ResetDeps = {
  truncateAll: () => Promise<void>;
  flushRedis: () => Promise<void>;
};

export const resetState = async (deps: ResetDeps): Promise<void> => {
  await deps.truncateAll();
  await deps.flushRedis();
};
