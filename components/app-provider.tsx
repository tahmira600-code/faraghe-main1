"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_PROVIDERS } from "@/lib/demo-data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AppUser,
  AvailabilitySlot,
  MatchRequest,
  Provider,
  ProviderDraft,
  UserRole,
} from "@/lib/types";

type DemoAccount = Pick<AppUser, "id" | "email" | "name" | "role">;

type AppContextValue = {
  user: AppUser | null;
  providers: Provider[];
  requests: MatchRequest[];
  ready: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  signOut: () => Promise<void>;
  saveProvider: (draft: ProviderDraft) => Promise<void>;
  createRequest: (provider: Provider, message: string, preferredDate: string, preferredTime: string) => Promise<void>;
  updateRequestStatus: (requestId: string, status: "accepted" | "declined") => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const USER_KEY = "farar.demo.session";
const ACCOUNTS_KEY = "farar.demo.accounts";
const PROVIDERS_KEY = "farar.demo.providers";
const REQUESTS_KEY = "farar.demo.requests";

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fromDatabase(row: Record<string, unknown>): Provider {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? "مقدّم خدمة"),
    profession: String(row.profession ?? "خدمة منزلية"),
    city: String(row.city ?? ""),
    bio: String(row.bio ?? ""),
    email: String(row.email ?? ""),
    yearsExperience: Number(row.years_experience ?? 0),
    travelsToClient: Boolean(row.travels_to_client),
    availability: parseAvailability(row.availability),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    color: String(row.color ?? "mint"),
  };
}

function toDatabase(profile: Provider) {
  return {
    id: profile.id,
    full_name: profile.fullName,
    profession: profile.profession,
    city: profile.city,
    bio: profile.bio,
    email: profile.email,
    years_experience: profile.yearsExperience,
    travels_to_client: profile.travelsToClient,
    availability: profile.availability,
    rating: profile.rating,
    review_count: profile.reviewCount,
    color: profile.color,
  };
}

function fromRequest(row: Record<string, unknown>, providerName?: string): MatchRequest {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    providerId: String(row.provider_id),
    providerName: providerName ?? "مقدّم الخدمة",
    clientName: String(row.client_name ?? "زبون"),
    message: String(row.message ?? ""),
    preferredDate: String(row.preferred_date ?? ""),
    preferredTime: String(row.preferred_time ?? ""),
    status: (row.status as MatchRequest["status"]) ?? "pending",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function parseAvailability(value: unknown): AvailabilitySlot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const slot = item as Record<string, unknown>;
    const weekday = Number(slot.weekday);
    const start = String(slot.start ?? "");
    const end = String(slot.end ?? "");
    if (weekday < 1 || weekday > 7 || !/^\d{2}:\d{2}$/.test(start) \vert{}\vert{} !/^\d{2}:\d{2}$/.test(end)) return [];
    return [{ weekday, start, end }];
  });
}

function userFromAuth(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AppUser {
  const metadata = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: String(metadata.full_name ?? authUser.email?.split("@")[0] ?? "مستخدم faraghe"),
    role: metadata.role === "provider" ? "provider" : "client",
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [providers, setProviders] = useState<Provider[]>(DEMO_PROVIDERS);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [ready, setReady] = useState(false);
  const demoMode = !isSupabaseConfigured();

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    const load = async () => {
      if (!supabase) {
        const storedProviders = readStored<Provider[]>(PROVIDERS_KEY, DEMO_PROVIDERS);
        setProviders(storedProviders);
        setRequests(readStored<MatchRequest[]>(REQUESTS_KEY, []));
        setUser(readStored<AppUser | null>(USER_KEY, null));
        setReady(true);
        return;
      }

      const [authResult, profilesResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("service_profiles").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      if (!authResult.error && authResult.data.user) setUser(userFromAuth(authResult.data.user));
      let remoteProviders: Provider[] = [];
      if (!profilesResult.error && profilesResult.data) {
        remoteProviders = profilesResult.data.map((row) => fromDatabase(row as Record<string, unknown>));
      }
      setProviders(remoteProviders);
      if (authResult.data.user) {
        const { data: requestRows, error: requestError } = await supabase
          .from("match_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (!active) return;
        if (!requestError && requestRows) {
          const names = new Map(remoteProviders.map((provider) => [provider.id, provider.fullName]));
          setRequests(requestRows.map((row) => fromRequest(row as Record<string, unknown>, names.get(String(row.provider_id)))));
        }
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setUser(session?.user ? userFromAuth(session.user) : null);
      });
      setReady(true);
      return () => authListener.subscription.unsubscribe();
    };

    let cleanup: (() => void) | undefined;
    void load().then((result) => {
      if (typeof result === "function") cleanup = result;
    }).catch(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data.user) {
        setUser(userFromAuth(data.user));
        const { data: requestRows, error: requestError } = await supabase
          .from("match_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (!requestError && requestRows) {
          const names = new Map(providers.map((provider) => [provider.id, provider.fullName]));
          setRequests(requestRows.map((row) => fromRequest(row as Record<string, unknown>, names.get(String(row.provider_id)))));
        }
      }
      return;
    }

    const accounts = readStored<DemoAccount[]>(ACCOUNTS_KEY, []);
    const account = accounts.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!account) throw new Error("ما لقيناش حساب بهاد البريد. سجّل حساب جديد باش تكمل.");
    const demoUser: AppUser = { ...account, isDemo: true };
    setUser(demoUser);
    writeStored(USER_KEY, demoUser);
    void password;
  }, [providers]);

  const signUp = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role } },
      });
      if (error) throw new Error(error.message);
      if (!data.session || !data.user) return false;

      const newUser = userFromAuth(data.user);
      setUser(newUser);
      if (role === "provider") {
        const initialProfile: Provider = {
          id: data.user.id,
          fullName: name,
          email: email,
          profession: "",
          city: "",
          bio: "",
          yearsExperience: 0,
          travelsToClient: false,
          availability: [],
          rating: 0,
          reviewCount: 0,
          color: "mint",
        };
        const { error: profileError } = await supabase.from("service_profiles").upsert(toDatabase(initialProfile));
        if (profileError) throw new Error(profileError.message);
        setProviders((current) => [initialProfile, ...current.filter((item) => item.id !== initialProfile.id)]);
      }
      return true;
    }

    const accounts = readStored<DemoAccount[]>(ACCOUNTS_KEY, []);
    if (accounts.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("هاد البريد مسجل من قبل. دخل لحسابك عوض إنشاء حساب جديد.");
    }
    const newAccount: DemoAccount = {
      id: `demo-${crypto.randomUUID()}`,
      email,
      name,
      role,
    };
    writeStored(ACCOUNTS_KEY, [...accounts, newAccount]);
    const demoUser: AppUser = { ...newAccount, isDemo: true };
    setUser(demoUser);
    writeStored(USER_KEY, demoUser);
    if (role === "provider") {
      const profile: Provider = {
        id: demoUser.id,
        fullName: name,
        email: email,
        profession: "",
        city: "",
        bio: "",
        yearsExperience: 0,
        travelsToClient: false,
        availability: [],
        rating: 0,
        reviewCount: 0,
        color: "mint",
      };
      setProviders((current) => {
        const next = [profile, ...current.filter((item) => item.id !== profile.id)];
        writeStored(PROVIDERS_KEY, next);
        return next;
      });
    }
    void password;
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
    setUser(null);
    setRequests([]);
    localStorage.removeItem(USER_KEY);
  }, []);

  const saveProvider = useCallback(async (draft: ProviderDraft) => {
    if (!user) throw new Error("خاصك تدخل لحسابك قبل ما تحفظ الملف.");
    const existing = providers.find((item) => item.id === user.id);
    const profile: Provider = {
      ...draft,
      id: user.id,
      email: user.email || existing?.email || "",
      rating: existing?.rating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      color: existing?.color ?? "mint",
    };
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.from("service_profiles").upsert(toDatabase(profile));
      if (error) throw new Error(error.message);
    } else {
      const next = [profile, ...providers.filter((item) => item.id !== profile.id)];
      writeStored(PROVIDERS_KEY, next);
    }
    setProviders((current) => [profile, ...current.filter((item) => item.id !== profile.id)]);
  }, [providers, user]);

  const createRequest = useCallback(async (provider: Provider, message: string, preferredDate: string, preferredTime: string) => {
    if (!user) throw new Error("دخل لحسابك باش ترسل طلب المطابقة.");
    const supabase = getSupabaseBrowserClient();
    const request: MatchRequest = {
      id: crypto.randomUUID(),
      clientId: user.id,
      providerId: provider.id,
      providerName: provider.fullName,
      clientName: user.name,
      message,
      preferredDate,
      preferredTime,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    if (supabase) {
      const { data, error } = await supabase
        .from("match_requests")
        .insert({
          client_id: user.id,
          provider_id: provider.id,
          client_name: user.name,
          message,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      if (data) request.id = String(data.id);
    } else {
      const next = [request, ...requests];
      writeStored(REQUESTS_KEY, next);
    }
    setRequests((current) => [request, ...current]);
  }, [requests, user]);

  const updateRequestStatus = useCallback(async (requestId: string, status: "accepted" | "declined") => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.from("match_requests").update({ status }).eq("id", requestId);
      if (error) throw new Error(error.message);
    }
    setRequests((current) => {
      const next = current.map((request) => request.id === requestId ? { ...request, status } : request);
      if (!supabase) writeStored(REQUESTS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    user,
    providers,
    requests,
    ready,
    demoMode,
    signIn,
    signUp,
    signOut,
    saveProvider,
    createRequest,
    updateRequestStatus,
  }), [user, providers, requests, ready, demoMode, signIn, signUp, signOut, saveProvider, createRequest, updateRequestStatus]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useFarar() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useFarar must be used inside AppProvider");
  return context;
}
