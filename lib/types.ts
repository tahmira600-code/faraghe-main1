export type UserRole = "client" | "provider";

export type AvailabilitySlot = {
  weekday: number;
  start: string;
  end: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isDemo?: boolean;
};

export type Provider = {
  id: string;
  fullName: string;
  profession: string;
  city: string;
  bio: string;
  yearsExperience: number;
  travelsToClient: boolean;
  availability: AvailabilitySlot[];
  rating: number;
  reviewCount: number;
  color: string;
};

export type MatchRequest = {
  id: string;
  clientId: string;
  providerId: string;
  providerName: string;
  clientName: string;
  message: string;
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export type ProviderDraft = Omit<Provider, "id" | "rating" | "reviewCount" | "color">;
