import { apiFetch } from "./api";

export type UserProfileData = {
  id: string;
  authUserId: string;
  email: string | null;
  name: string;
  accountType: string;
  sessionStatus: "Authenticated Session" | "Session Expired" | "Not Authenticated";
};

export async function fetchUserProfile(token: string): Promise<UserProfileData> {
  const res = await apiFetch<{ success: boolean; user: UserProfileData }>("/api/user/profile", {
    token,
  });
  return res.user;
}

export async function updateUserProfileName(
  token: string,
  newName: string,
): Promise<UserProfileData> {
  const res = await apiFetch<{ success: boolean; user: UserProfileData }>("/api/user/profile", {
    method: "PATCH",
    token,
    body: { name: newName },
  });
  return res.user;
}
