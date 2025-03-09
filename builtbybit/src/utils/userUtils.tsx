import { Member } from "../types/member";
import apiClient, { CACHE_NAMESPACE, CACHE_TTL, CacheWithTTL } from "./constants";
import { showFailureToast } from "@raycast/utils";

/**
 * Utility class to interact with the BuiltByBit API.
 *
 * This class provides methods to retrieve user data via different identifiers
 * such as username, userID, or discordID. It uses Raycast preferences to obtain the API key.
 */

const userCache = new CacheWithTTL({
  namespace: CACHE_NAMESPACE.USERS,
});

type FetchMethod = "username" | "userID" | "discordID";

export class UserUtils {
  private static async fetchUserData(
    identifier: string,
    method: FetchMethod,
  ): Promise<{ result: string; data: Member }> {
    const cacheKey = `${method}-${identifier}`;

    const cachedData = await userCache.get<{ result: string; data: Member }>(cacheKey, CACHE_TTL.LONG);
    if (cachedData) {
      console.log("Using cached data:", cachedData);
      return cachedData;
    }

    let endpoint = "";
    switch (method) {
      case "username":
        endpoint = `/members/usernames/${identifier}`;
        break;
      case "userID":
        endpoint = `/members/${identifier}`;
        break;
      case "discordID":
        endpoint = `/members/discords/${identifier}`;
        break;
    }
    const response = await apiClient.get(endpoint);

    if (!response.data || !response.data.data) {
      console.error("Invalid API response structure:", response.data);
      await showFailureToast("Invalid API response", { title: "Error", message: response.data });
      throw new Error("Invalid API response structure");
    }

    const memberData = response.data;

    if (!memberData.data || !memberData.data.username) {
      console.error("Invalid member data:", memberData);
      await showFailureToast("User not found", { title: "User not found" });
      throw new Error("No user found");
    }

    await userCache.set(cacheKey, memberData);
    return memberData;
  }

  public static async idToUsername(userId: number | string): Promise<string> {
    try {
      const memberData = await this.fetchUserData(userId.toString(), "userID");

      if (!memberData || !memberData.data) {
        console.error("Member data is null or undefined");
        return "Unknown User";
      }

      if (typeof memberData.data.username !== "string") {
        console.error("Username is not a string:", memberData.data.username);
        return "Unknown User";
      }

      return memberData.data.username;
    } catch (error) {
      console.error("Error in idToUsername:", error);
      return "Unknown User";
    }
  }

  public static async usernameToId(username: string): Promise<string> {
    const memberData = await this.fetchUserData(username, "username");
    return memberData.data.member_id.toString();
  }

  public static async getMemberById(userId: number | string): Promise<Member> {
    const memberData = await this.fetchUserData(userId.toString(), "userID");
    return memberData.data;
  }

  public static async getMemberByDiscordId(discordId: number | string): Promise<Member> {
    const memberData = await this.fetchUserData(discordId.toString(), "discordID");
    return memberData.data;
  }

  public static clearCache(): void {
    userCache.clear();
  }

  public static async refreshMemberData(identifier: string, method: FetchMethod): Promise<Member> {
    await userCache.remove(`${method}-${identifier}`);
    const memberData = await this.fetchUserData(identifier, method);
    return memberData.data;
  }
}
