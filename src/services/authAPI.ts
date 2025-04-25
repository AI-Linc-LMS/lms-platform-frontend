import axios from 'axios';

const API_BASE_URL = 'https://be-app.ailinc.com/';


export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    // Add other user properties as needed
  };
  token: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  slug: string;
}

export interface SignupResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
    'X-CSRFTOKEN': 'wY9p3SUubCcsEuedOCYH9KDASzKKSKEfYlLajoMOhATWayXAsVGW7mPXgDy45wFZ'
  },
});

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await authAPI.post('/accounts/user/login/', credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw error;
  }
};

export const signupUser = async (data: SignupPayload): Promise<SignupResponse> => {
  try {
    // Generate a slug from the name if not provided
    const payloadWithSlug = {
      ...data,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
    };
    console.log('Sending signup data:', payloadWithSlug);
    const response = await authAPI.post('/accounts/clients/', payloadWithSlug);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiError>(error)) {
      console.error('Signup error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                         Object.entries(error.response?.data?.errors || {})
                           .map(([key, msgs]) => `${key}: ${msgs.join(', ')}`)
                           .join('; ') ||
                         'Signup failed';
      throw new Error(errorMessage);
    }
    throw new Error('An unexpected error occurred');
  }
};
