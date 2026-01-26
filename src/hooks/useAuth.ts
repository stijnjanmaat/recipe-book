import { useQuery } from '@tanstack/react-query'
import { getSession } from '~/lib/auth/functions'

/**
 * Client-side auth hook
 * Checks if user has a valid session and is a superadmin
 */
export function useAuth() {
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return await getSession()
      } catch {
        return null
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Consider session fresh for 5 minutes
  })

  const isAuthenticated = !!session?.user
  const isSuperadmin = session?.user && (session.user as any).role === 'superadmin'
  const user = session?.user

  return {
    session,
    user,
    isAuthenticated,
    isSuperadmin,
    isLoading,
    error,
  }
}
