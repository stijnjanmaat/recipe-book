import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import i18n, {
  detectLocaleFromPath,
  ensureI18nInitialized,
} from "~/lib/i18n/config";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import { useAuth } from "~/hooks/useAuth";
import "../app.css";

const queryClient = new QueryClient();

function NotFoundCulinary() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = detectLocaleFromPath(pathname);
  const localeParam = locale === "en" ? undefined : locale;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="text-8xl mb-4" aria-hidden>
          🍳
        </div>
        <p className="text-7xl font-bold text-primary border-b-2 border-primary pb-2 mb-3">
          404
        </p>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {t("notFound.title")}
        </h1>
        <p className="text-muted-foreground italic mb-6">
          {t("notFound.culinaryTagline")}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          {t("notFound.description")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/{-$locale}" params={{ locale: localeParam }}>
              {t("notFound.backToHome")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/{-$locale}/recipes" params={{ locale: localeParam }}>
              {t("notFound.backToRecipes")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // Detect locale from URL path on root route as well
    // This ensures i18n is set before the root component renders
    const locale = detectLocaleFromPath(location.pathname);

    // Ensure i18n is initialized with the correct locale
    // This runs before any components render, preventing hydration mismatches
    await ensureI18nInitialized(locale);
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      },
      {
        name: "description",
        content: "A recipe collection app with AI-powered extraction",
      },
      {
        name: "theme-color",
        content: "#fab429",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Recipe Book",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        title: i18n.t("nav.appName"), // This is for the HTML <title> tag, can stay in English
      },
    ],
    links: [
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: "/icon-192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        href: "/icon-512.png",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundCulinary,
});

function RootComponent() {
  // Get locale from URL path
  const routerState = useRouterState();
  const currentRoute = routerState.location.pathname;
  const locale = detectLocaleFromPath(currentRoute);

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen flex-col bg-background">
            <NavWithSession locale={locale} />
            <main className="max-w-7xl mx-auto w-full flex-1 py-6 sm:px-6 lg:px-8">
              <Outlet />
              <Scripts />
            </main>
            <footer className="border-t-2 border-border bg-card py-3">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
                <LanguageSwitcher />
              </div>
            </footer>
            {import.meta.env.DEV && <TanStackRouterDevtools />}
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}

function NavWithSession({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Use the auth hook to check session and superadmin role
  const { session, isAuthenticated, isSuperadmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();

      // Clear all React Query cache
      qc.clear();

      // Clear any localStorage/sessionStorage related to auth
      if (typeof window !== "undefined") {
        // Clear any Better Auth related storage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("better-auth") || key.startsWith("auth")) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("better-auth") || key.startsWith("auth")) {
            sessionStorage.removeItem(key);
          }
        });
      }

      // Redirect to login page
      navigate({
        to: "/{-$locale}/login",
        params: { locale: locale === "en" ? undefined : locale },
        replace: true,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // On error, clear everything and force reload
      qc.clear();
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = "/{-$locale}/login";
    }
  };

  return (
    <nav className="bg-card border-b-2 border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="shrink-0">
              <Link
                to="/{-$locale}"
                params={{ locale: locale === "en" ? undefined : locale }}
                className="text-xl font-bold text-foreground"
              >
                {t("nav.appName")}
              </Link>
            </div>
            {isAuthenticated && isSuperadmin && (
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-2">
                <Button asChild variant="ghost">
                  <Link
                    to="/{-$locale}/recipes"
                    params={{ locale: locale === "en" ? undefined : locale }}
                  >
                    {t("nav.recipes")}
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link
                    to="/{-$locale}/add"
                    params={{ locale: locale === "en" ? undefined : locale }}
                  >
                    {t("nav.addRecipe")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="ghost" onClick={handleSignOut}>
                {t("auth.signOut")}
              </Button>
            ) : (
              <Button asChild variant="ghost">
                <Link
                  to="/{-$locale}/login"
                  params={{ locale: locale === "en" ? undefined : locale }}
                >
                  {t("auth.signIn")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
