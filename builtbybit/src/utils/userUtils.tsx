import axios from "axios";
import { Member } from "../types/member";
import { API_KEY } from "./constants";

/**
 * Utility class to interact with the BuiltByBit API.
 *
 * This class provides methods to retrieve user data via different identifiers
 * such as username, userID, or discordID. It uses Raycast preferences to obtain the API key.
 */
export class UserUtils {
  /**
   * Fetches user data from the BuiltByBit API based on the identifier and method.
   *
   * @param identifier - The unique value used for lookup (username, userID, or discordID).
   * @param method - The method to use for lookup. Accepted values: "username", "userID", "discordID".
   * @returns A promise that resolves to a Member object.
   *
   * @throws Error if the method is invalid, no user is found, or the API request fails.
   */
  private static async fetchUserData(identifier: string, method: "username" | "userID" | "discordID"): Promise<Member> {
    let url: string;

    switch (method) {
      case "username":
        url = `https://api.builtbybit.com/v1/members/usernames/${identifier}`;
        break;
      case "userID":
        url = `https://api.builtbybit.com/v1/members/${identifier}`;
        break;
      case "discordID":
        url = `https://api.builtbybit.com/v1/members/discords/${identifier}`;
        break;
      default:
        throw new Error("Invalid method");
    }

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Private ${API_KEY}`, "Content-Type": "application/json" },
      });

      console.log("API response for user data:", response.data); // Log the API response

      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        throw new Error("No user found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw new Error("Failed to fetch user data");
    }
  }

  /**
   * Retrieves the username for a given user based on the UserID lookup.
   *
   * @param userId - The userId to lookup.
   * @returns A promise that resolves to the username. Returns "Unknown Username" if not found.
   */
  public static async IDToUsername(userId: string): Promise<string> {
    const member = await UserUtils.fetchUserData(userId, "userID");
    return member.username ? member.username : "Unknown Username"; // Use optional chaining
  }

  /**
   * Retrieves the user ID for a given username.
   *
   * @param username - The username to lookup.
   * @returns A promise that resolves to the user ID (as a string). Returns "Unknown ID" if not found.
   */
  public static async usernameToID(username: string): Promise<string> {
    const member = await UserUtils.fetchUserData(username, "username");
    return member?.member_id ? member.member_id.toString() : "Unknown ID"; // Use optional chaining
  }

  /**
   * Retrieves member information based on a user ID.
   *
   * @param userID - The user ID to lookup.
   * @returns A promise that resolves to a Member object.
   */
  public static async userIDToMember(userID: string): Promise<Member> {
    return await UserUtils.fetchUserData(userID, "userID");
  }

  /**
   * Retrieves member information based on a Discord ID.
   *
   * @param discordID - The Discord ID to lookup.
   * @returns A promise that resolves to a Member object.
   */
  public static async discordIDToMember(discordID: string): Promise<Member> {
    return await UserUtils.fetchUserData(discordID, "discordID");
  }
}
