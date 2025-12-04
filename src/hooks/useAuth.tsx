import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getSession, signOut as signOutService } from '@/services/auth';
import { fetchProfile, fetchUserRole } from '@/services/users';
import { isFailure } from '@/types/api';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  user_type: string;
  bio: string | null;
  preferred_currency?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

type UserRole = 'user' | 'admin' | 'super_admin';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user profile and role data. Uses setTimeout(0) to avoid Supabase auth deadlocks.
   */
  const fetchUserData = (userId: string) => {
    setTimeout(async () => {
      try {
        const [profileResult, roleResult] = await Promise.all([fetchProfile(userId), fetchUserRole(userId)]);

        if (isFailure(profileResult)) {
          setProfile(null);
        } else {
          setProfile(profileResult.data as Profile);
        }

        if (isFailure(roleResult)) {
          setRole('user');
        } else {
          setRole(roleResult.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setProfile(null);
        setRole('user');
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  useEffect(() => {
    // Set up the auth listener first
    const subscription = onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Then check for existing session (important for email confirmations)
    getSession().then((result) => {
      if (!isFailure(result) && result.data) {
        const session = result.data;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await signOutService();
  };

  const refetchProfile = async () => {
    if (user) {
      const result = await fetchProfile(user.id);

      if (!isFailure(result)) {
        setProfile(result.data as Profile);
      }
    }
  };

  const hasRole = (requiredRole: UserRole) => {
    if (!role) return false;

    const roleHierarchy = {
      user: 0,
      admin: 1,
      super_admin: 2,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = hasRole('admin');
  const isSuperAdmin = hasRole('super_admin');

  const isSeller = profile?.user_type === 'seller' || profile?.user_type === 'both';
  const isBuyer = profile?.user_type === 'buyer';

  const value = {
    user,
    session,
    profile,
    role,
    loading,
    isAdmin,
    isSuperAdmin,
    signOut,
    refetchProfile,
    isSeller,
    isBuyer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
