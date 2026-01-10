import { UserProfile } from "@/lib/services/accounts.service";

/**
 * Get user's display name in standard format: "First Last"
 * Falls back to user_name if first_name/last_name not available
 */
export const getUserDisplayName = (user: UserProfile | null): string => {
  if (!user) return "User";
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  return user.user_name || "User";
};

/**
 * Get user's initials for avatar
 */
export const getUserInitials = (user: UserProfile | null): string => {
  if (!user) return "U";
  
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  
  return user.user_name?.[0]?.toUpperCase() || "U";
};

/**
 * Get user's profile picture URL
 */
export const getUserProfilePicture = (user: UserProfile | null): string | undefined => {
  if (!user) return undefined;
  return user.profile_picture || undefined;
};

