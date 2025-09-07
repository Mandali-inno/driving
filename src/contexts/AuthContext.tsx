import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User } from '../lib/supabase';
import { mockUsers } from '../lib/mockData';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      // Use mock data
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setUser(data || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      // Mock sign up
      const newUser = {
        id: crypto.randomUUID(),
        email,
        full_name: userData.full_name || '',
        phone_number: userData.phone_number || '',
        role: userData.role || 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;
      setUser(newUser);
      toast.success('Account created successfully!');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile - wait a moment for auth to be fully established
      setTimeout(async () => {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email,
              full_name: userData.full_name || '',
              phone_number: userData.phone_number || '',
              role: userData.role || 'student',
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            toast.error('Account created but profile setup failed. Please contact support.');
          }
        } catch (err) {
          console.error('Profile creation error:', err);
          toast.error('Account created but profile setup failed. Please contact support.');
        }
      }, 1000);
      toast.success('Account created successfully!');
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      // Mock sign in
      const foundUser = mockUsers.find(u => u.email === email) || mockUsers[0];
      setUser(foundUser);
      toast.success('Signed in successfully!');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else {
        toast.error(error.message || 'An error occurred during sign in');
      }
      throw error;
    }
    toast.success('Signed in successfully!');
  };

  const signOut = async () => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      // Mock sign out
      setUser(null);
      toast.success('Signed out successfully!');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('Signed out successfully!');
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      // Mock update
      setUser({ ...user, ...userData });
      toast.success('Profile updated successfully!');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', user.id);

    if (error) throw error;
    setUser({ ...user, ...userData });
    toast.success('Profile updated successfully!');
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};