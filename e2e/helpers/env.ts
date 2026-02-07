export type E2eEnv = {
  baseUrl: string;
  fingerprint: string;
};

const required = (key: string): string => {
  const v = process.env[key];
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new Error(`Missing env: ${key}`);
  }
  return v;
};

export const e2eEnv = (): E2eEnv => ({
  baseUrl: required("E2E_BASE_URL"),
  fingerprint: required("E2E_FINGERPRINT"),
});
