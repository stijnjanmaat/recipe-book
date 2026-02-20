/**
 * Route protection utilities
 * Works on both client and server
 */
import { redirect } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";

/**
 * Client-side auth check for beforeLoad hooks
 * Only runs on client (browser), server-side protection is handled by middleware
 */
export async function checkClientAuth(locale: string) {
  // Only run on client side
  if (typeof window === "undefined") {
    return; // Server-side protection handled by middleware
  }

  try {
    // Import auth client dynamically to avoid SSR issues
    const sessionResult = await authClient.getSession();

    // Better Auth client returns { data: { user, session } | null } or error
    const session =
      sessionResult && "data" in sessionResult ? sessionResult.data : null;

    if (!session?.user || (session.user as any).role !== "superadmin") {
      throw redirect({
        to: "/{-$locale}/login",
        params: { locale: locale === "en" ? undefined : locale },
        replace: true,
      });
    }
  } catch (error) {
    // If it's a redirect, re-throw it
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }
    // Otherwise, redirect to login on any error
    throw redirect({
      to: "/{-$locale}/login",
      params: { locale: locale === "en" ? undefined : locale },
      replace: true,
    });
  }
}
