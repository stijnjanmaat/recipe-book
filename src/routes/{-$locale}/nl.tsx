import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { IndexComponent } from ".";
import { detectLocaleFromPath, ensureI18nInitialized } from "~/lib/i18n/config";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/hooks/useAuth";

export const Route = createFileRoute("/{-$locale}/nl")({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname);

    // CRITICAL: Set i18n locale synchronously before any components render
    // This ensures SSR and client render with the same language
    await ensureI18nInitialized(locale);

    return { locale };
  },
  loader: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname);
    await ensureI18nInitialized(locale);

    return { locale };
  },
  component: IndexComponent,
});
