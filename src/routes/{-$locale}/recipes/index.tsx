import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { detectLocaleFromPath, ensureI18nInitialized } from "~/lib/i18n/config";
import { RecipeTable } from "~/components/RecipeTable";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/hooks/useAuth";

export const Route = createFileRoute("/{-$locale}/recipes/")({
  beforeLoad: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname);
    await ensureI18nInitialized(locale);
    return { locale };
  },
  loader: async ({ location }) => {
    const locale = detectLocaleFromPath(location.pathname);
    await ensureI18nInitialized(locale);
    return { locale };
  },
  component: AllRecipesComponent,
});

function AllRecipesComponent() {
  const { t } = useTranslation();
  const { isAuthenticated, isSuperadmin } = useAuth();
  const allParams = useParams({ strict: false });
  const currentLocale = allParams.locale || "en";
  const canEdit = isAuthenticated && isSuperadmin;

  return (
    <div className="px-4 py-4 sm:py-6 sm:px-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("recipes.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("recipes.description")}
          </p>
        </div>
        {canEdit && (
          <Button asChild size="sm" className="w-full sm:w-auto shrink-0">
            <Link
              to="/{-$locale}/add"
              params={{
                locale: currentLocale === "en" ? undefined : currentLocale,
              }}
            >
              <Plus className="size-4 sm:mr-1.5" />
              {t("nav.addRecipe")}
            </Link>
          </Button>
        )}
      </div>
      <RecipeTable canEdit={canEdit} />
    </div>
  );
}
