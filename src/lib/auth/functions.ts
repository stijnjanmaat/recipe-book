/**
 * Auth server functions
 * These can be safely imported anywhere (client or server)
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

// Get current session
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth } = await import('~/lib/auth')
  const headers = getRequestHeaders()
  return await auth.api.getSession({ headers })
})

// Sign out
export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  // Better Auth handles sign out through the API route
  return { success: true }
})
