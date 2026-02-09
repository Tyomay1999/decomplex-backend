export type Cookie = string;

export type HttpOk<T> = {
  status: number;
  body: T;
  cookies: Cookie[];
  headers: Record<string, unknown>;
};

export type HttpErr = {
  status: number;
  body: unknown;
  cookies: Cookie[];
  headers: Record<string, unknown>;
};

export type HttpResult<T> = HttpOk<T> | HttpErr;

export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type UserType = "company" | "candidate";

export type CandidateRegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  language: string;
};

export type CompanyRegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type CompanyUserRegisterPayload = {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "recruiter";
  language: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberUser?: boolean;
  fingerprint?: string;
};

export type CreateVacancyPayload = {
  title: string;
  description: string;
  location?: string;
  jobType: "full_time" | "part_time" | "remote" | "hybrid";
};

export type VacanciesListData = {
  vacancies: VacancyItem[];
  nextCursor: string | null;
};

export type LoginData = {
  fingerprintHash: string;
  accessToken: string;
  refreshToken: string;
  userType: UserType;
  user: {
    id: string;
    email: string;
    role?: string;
    language?: string;
    position?: string;
    companyId?: string;
  };
  company?: {
    id: string;
    name: string;
    defaultLocale: string;
    status: string;
  };
};

export type AuthSession = {
  cookies: Cookie[];
  accessToken: string;
  refreshToken?: string;
};

export type RefreshData = {
  accessToken?: string;
  refreshToken?: string;
};

export type MeData = {
  userType: UserType;
  user: {
    id: string;
    email: string;
    role?: string;
    language?: string;
    position?: string;
    companyId?: string;
  };
  company?: {
    id: string;
    name: string;
    defaultLocale: string;
    status: string;
  };
};

export type VacancyItem = {
  id: string;
  companyId: string;
  createdById: string;
  title: string;
  description: string;
  salaryFrom: number | null;
  salaryTo: number | null;
  jobType: string;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateVacancyData = {
  vacancy: VacancyItem;
};

export type ApplicationItem = {
  id: string;
  vacancyId: string;
  candidateId: string;
  cvFilePath: string | null;
  coverLetter: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplyVacancyData = {
  application: ApplicationItem;
};

export type MyApplicationsData = {
  items: ApplicationItem[];
};

export type CandidatePublic = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: string;
};

export type VacancyApplicationItem = ApplicationItem & {
  candidate?: CandidatePublic;
};

export type VacancyApplicationsData = {
  items: VacancyApplicationItem[];
  nextCursor: string | null;
};

export type RegisterCompanyData = { companyId: string } | { company: { id: string } };
