// Auth Service
// Centralized authentication operations

import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { withErrorHandling, withMaybeNull } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface SignUpOptions {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
    data?: {
      full_name?: string;
      username?: string;
      user_type?: string;
      agreed_to_communications?: boolean;
    };
  };
}

export interface SignInOptions {
  email: string;
  password: string;
}

export interface SignUpResponse {
  user: User | null;
  session: Session | null;
}

export interface SignInResponse {
  user: User;
  session: Session;
}

// Sign up a new user
export async function signUp(options: SignUpOptions): Promise<Result<SignUpResponse>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.auth.signUp({
      email: options.email,
      password: options.password,
      options: options.options,
    });

    if (error) throw error;
    return {
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
    };
  }, 'signUp');
}

// Sign in a user
export async function signIn(options: SignInOptions): Promise<Result<SignInResponse>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: options.email,
      password: options.password,
    });

    if (error) throw error;
    return {
      data: {
        user: data.user!,
        session: data.session!,
      },
      error: null,
    };
  }, 'signIn');
}

// Sign out the current user
export async function signOut(): Promise<Result<void>> {
  return withErrorHandling(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { data: undefined, error: null };
  }, 'signOut');
}

// Get the current session
export async function getSession(): Promise<Result<Session | null>> {
  return withMaybeNull(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: data.session, error: null };
  }, 'getSession');
}

// Reset password for email
export async function resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<Result<void>> {
  return withErrorHandling(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return { data: undefined, error: null };
  }, 'resetPasswordForEmail');
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
