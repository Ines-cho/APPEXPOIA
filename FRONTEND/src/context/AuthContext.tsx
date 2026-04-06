import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface ProfileData {
  healthConditions?: string[];
  otherConditions?: string;
  dietaryRestrictions?: string;
  foodPreferences?: string;
  monthlyBudget?: number;
  familySize?: number;
  additionalNotes?: string;
  startDate?: string; // Add start date for week calculation
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  profileData: ProfileData | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerOnly: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; token?: string }>;
  completeAuth: () => Promise<{ success: boolean; message: string }>;
  setProfileData: (data: ProfileData) => void;
  signOut: () => void;
  isLoading: boolean;
}

const API_BASE_URL = 'http://localhost:8000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string; user?: User; token?: string } | null>(null);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      const storedProfileData = await AsyncStorage.getItem('auth_profile_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        if (storedProfileData) {
          setProfileData(JSON.parse(storedProfileData));
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuthData = async (user: User, token: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const storeProfileData = async (profileData: ProfileData) => {
    try {
      await AsyncStorage.setItem('auth_profile_data', JSON.stringify(profileData));
    } catch (error) {
      console.error('Error storing profile data:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('auth_profile_data');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const setProfileDataHandler = (data: ProfileData) => {
    setProfileData(data);
    storeProfileData(data);
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        setIsAuthenticated(true);
        await storeAuthData(data.data.user, data.data.token);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.detail || data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const signUp = async (fullName: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    console.log('AuthContext signUp called with:', { fullName, email, password });
    try {
      console.log('Making API call to:', `${API_BASE_URL}/auth/register`);
      
      const requestBody = JSON.stringify({ fullName, email, password });
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('API response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.log('Raw response text:', await response.text());
        return { success: false, message: 'Invalid response from server' };
      }

      if (response.ok && data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        setIsAuthenticated(true);
        await storeAuthData(data.data.user, data.data.token);
        return { success: true, message: data.message };
      } else {
        console.error('API Error:', { status: response.status, data });
        return { success: false, message: data.detail || data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const registerOnly = async (fullName: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: User; token?: string }> => {
    console.log('AuthContext registerOnly called with:', { fullName, email, password });
    try {
      console.log('Making API call to:', `${API_BASE_URL}/auth/register`);
      
      const requestBody = JSON.stringify({ fullName, email, password });
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      console.log('API response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('API response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        return { success: false, message: 'Invalid response from server' };
      }

      if (response.ok && data.success) {
        // Store pending auth data for later completion
        setPendingAuth({
          email: email,
          password: password,
          user: data.data.user,
          token: data.data.token
        });
        
        return { 
          success: true, 
          message: data.message,
          user: data.data.user,
          token: data.data.token
        };
      } else {
        console.error('API Error:', { status: response.status, data });
        return { success: false, message: data.detail || data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const completeAuth = async (): Promise<{ success: boolean; message: string }> => {
    if (!pendingAuth) {
      return { success: false, message: 'No pending authentication' };
    }

    try {
      // Set authentication state with stored data
      setUser(pendingAuth.user || null);
      setToken(pendingAuth.token || null);
      setIsAuthenticated(true);
      
      // Store in AsyncStorage
      if (pendingAuth.user && pendingAuth.token) {
        await storeAuthData(pendingAuth.user, pendingAuth.token);
      }
      
      // Clear pending auth
      setPendingAuth(null);
      
      return { success: true, message: 'Authentication completed successfully' };
    } catch (error) {
      console.error('Complete auth error:', error);
      return { success: false, message: 'Failed to complete authentication' };
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfileData(null);
    setToken(null);
    setIsAuthenticated(false);
    await clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      profileData,
      token, 
      signIn, 
      signUp, 
      registerOnly,
      completeAuth,
      setProfileData: setProfileDataHandler,
      signOut, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
