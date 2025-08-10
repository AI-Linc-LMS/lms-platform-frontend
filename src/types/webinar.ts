export interface WebinarData {
  id?: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  day: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebinarFormData {
  title: string;
  subtitle: string;
  date: string;
  time: string;
}

export interface WebinarResponse {
  success: boolean;
  data: WebinarData[];
  message?: string;
}
