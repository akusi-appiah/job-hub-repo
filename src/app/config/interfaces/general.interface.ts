import { TemplateRef } from "@angular/core";

export interface JobPreference {
  id: string;
  name: string;
  category: string;
}

export interface JobCategory {
  id: string;
  name: string;
  description: string;
}

export interface SignUpData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  jobPreferences: string[]; // Array of preference IDs
}

export interface UserData extends Omit<SignUpData, 'username' | 'password' | 'jobPreferences'> {}
export interface SignInData {
  username: string;
  password: string;
}

export interface ResetPasswordData {
  username: string;
  code: string;
  newPassword: string;
}

export   interface SelectOption {
    id: string;
    name: string;
    category: string;
}

export interface Categories {
  categoryId: string;
  name: string;
  description:string;
  snsTopicArn: string;
  createdAt: string|null;
}


export interface CategoriesResponse {
  categories:Categories[]
  count:number
}

export interface Job {
  jobId: string;
  ownerId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  payAmount: number;
  timeToCompleteSeconds: number;
  expiryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  claimerId: string | null;
  claimedAt: string | null;
  submissionDeadline: string | null;
  submittedAt: string | null;
}

export type JobBoardMode = 'jobSeeker' | 'jobOwner'| 'admin';
export interface User extends Omit<SignUpData, 'username' | 'password'> {};

export interface Toast {
  template?: TemplateRef<any>;
  text?: string;
  classname?: string;
  delay?: number;
}

export interface ListParams {
    offset?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
}

export interface UserState {
  userId: string | null;
  userType: string | null;
  categoryIds: number[] | null;
  personalData: { email: string; firstname: string; lastname: string } | null;
  loading: boolean;
  error: string | null;
};
