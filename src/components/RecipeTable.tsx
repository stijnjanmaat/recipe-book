import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ChefHat,
  ChevronDown,
  Clock,
  Eye,
  Flame,
  MoreVertical,
  Pencil,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
} from "@tanstack/react-table";
import type { Recipe } from "~/types/recipe";
import { useRecipes } from "~/hooks/useRecipes";
import { detectLocaleFromPath } from "~/lib/i18n/config";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Type for recipe with database fields and relations
type RecipeWithId = Recipe & {
  id: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  servingsRelevant?: boolean; // Converted from integer (0/1) to boolean in server
  ingredients?: Array<{
    id: number;
    recipeId: number | null;
    name: string;
    amount: string | null;
    unit: string | null;
    notes: string | null;
    order: number | null;
  }>;
  instructions?: Array<{
    id: number;
    recipeId: number | null;
    step: number;
    instruction: string;
    imageUrl: string | null;
  }>;
};

const COOK_TIME_RANGES = [
  { value: "under15", min: 0, max: 14 },
  { value: "15to30", min: 15, max: 30 },
  { value: "30to60", min: 31, max: 60 },
  { value: "over60", min: 61, max: Infinity },
] as const;

type RecipeTableProps = {
  canEdit?: boolean;
};

export function RecipeTable({ canEdit = false }: RecipeTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routerState = useRouterState();
  // Detect locale from URL path
  const currentRoute = routerState.location.pathname;
  const currentLocale = detectLocaleFromPath(currentRoute);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [tagFilter, setTagFilter] = useState<Array<string>>([]);
  const [cuisineFilter, setCuisineFilter] = useState<string>("");
  const [cookTimeFilter, setCookTimeFilter] = useState<string>("");

  const { data: recipes = [], isLoading, error } = useRecipes();

  // Clear all filters
  const clearFilters = () => {
    setGlobalFilter("");
    setTagFilter([]);
    setCuisineFilter("");
    setCookTimeFilter("");
  };

  const hasActiveFilters =
    globalFilter || tagFilter.length > 0 || cuisineFilter || cookTimeFilter;

  // Combined filter object for TanStack Table to watch all filter changes
  const combinedFilter = useMemo(
    () => ({
      search: globalFilter,
      tags: tagFilter,
      cuisine: cuisineFilter,
      cookTime: cookTimeFilter,
    }),
    [globalFilter, tagFilter, cuisineFilter, cookTimeFilter]
  );

  // Recipes that pass current filters (for cascading dropdown options)
  const visibleRecipes = useMemo(() => {
    const list = recipes as Array<RecipeWithId>;
    if (!combinedFilter) return list;

    const { search, tags, cuisine, cookTime } = combinedFilter;

    return list.filter((recipe) => {
      if (tags.length > 0) {
        if (!recipe.tags || !Array.isArray(recipe.tags)) return false;
        if (!tags.every((tag) => recipe.tags?.includes(tag))) return false;
      }
      if (cuisine && recipe.cuisine !== cuisine) return false;
      if (cookTime) {
        const range = COOK_TIME_RANGES.find((r) => r.value === cookTime);
        if (range) {
          const ct = recipe.cookTime;
          if (ct == null || ct < range.min || ct > range.max) return false;
        }
      }
      const term = search?.toLowerCase() || "";
      if (!term) return true;
      if (recipe.title?.toLowerCase().includes(term)) return true;
      if (recipe.description?.toLowerCase().includes(term)) return true;
      if (recipe.tags?.some((tagItem) => tagItem?.toLowerCase().includes(term)))
        return true;
      if (
        recipe.ingredients?.some((ing) =>
          ing.name?.toLowerCase().includes(term)
        )
      )
        return true;
      if (
        recipe.instructions?.some((i) =>
          i.instruction?.toLowerCase().includes(term)
        )
      )
        return true;
      if (recipe.cuisine?.toLowerCase().includes(term)) return true;
      return false;
    });
  }, [recipes, combinedFilter]);

  // Cascading options: only show tags/cuisines that exist in the current filter result
  const { uniqueTags, uniqueCuisines } = useMemo(() => {
    const tagsSet = new Set<string>();
    const cuisinesSet = new Set<string>();
    for (const recipe of visibleRecipes) {
      if (recipe.tags?.length) {
        for (const tag of recipe.tags) {
          if (tag) tagsSet.add(tag);
        }
      }
      if (recipe.cuisine) cuisinesSet.add(recipe.cuisine);
    }
    return {
      uniqueTags: Array.from(tagsSet).sort(),
      uniqueCuisines: Array.from(cuisinesSet).sort(),
    };
  }, [visibleRecipes]);

  const columns: Array<ColumnDef<RecipeWithId>> = [
    {
      accessorKey: "imageBlobUrl",
      header: t("recipes.table.image"),
      cell: ({ row }) => {
        const imageUrl =
          row.original.imageBlobUrl || row.original.sourceImageUrl;
        return (
          <Link
            to="/{-$locale}/recipes/$recipeId"
            params={{
              recipeId: row.original.id.toString(),
              locale: currentLocale === "en" ? undefined : currentLocale,
            }}
            className="block"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={row.original.title}
                className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 transition-colors">
                {t("recipes.table.noImage")}
              </div>
            )}
          </Link>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: t("recipes.table.title"),
      size: 300, // Target width in pixels
      cell: ({ row }) => (
        <Link
          to="/{-$locale}/recipes/$recipeId"
          params={{
            recipeId: row.original.id.toString(),
            locale: currentLocale === "en" ? undefined : currentLocale,
          }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "description",
      header: t("recipes.table.description"),
      size: 400, // Target width in pixels
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground line-clamp-3">
          {row.original.description || "-"}
        </div>
      ),
    },
    {
      accessorKey: "cuisine",
      header: t("recipes.table.cuisine"),
      cell: ({ row }) => row.original.cuisine || "-",
    },
    {
      accessorKey: "difficulty",
      header: t("recipes.table.difficulty"),
      cell: ({ row }) => {
        const difficulty = row.original.difficulty;
        if (!difficulty) return "-";
        const colors = {
          easy: "bg-green-100 text-green-800",
          medium: "bg-yellow-100 text-yellow-800",
          hard: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              colors[difficulty] || "bg-gray-100 text-gray-800"
            }`}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "prepTime",
      header: t("recipes.table.prepTime"),
      cell: ({ row }) => {
        const prepTime = row.original.prepTime;
        return prepTime ? `${prepTime} ${t("common.minutes")}` : "-";
      },
    },
    {
      accessorKey: "cookTime",
      header: t("recipes.table.cookTime"),
      cell: ({ row }) => {
        const cookTime = row.original.cookTime;
        return cookTime ? `${cookTime} ${t("common.minutes")}` : "-";
      },
    },
    {
      accessorKey: "servings",
      header: t("recipes.table.servings"),
      cell: ({ row }) => {
        const servings = row.original.servings;
        const servingsRelevant = row.original.servingsRelevant !== false; // Default to true if undefined
        if (!servingsRelevant) return "-";
        return servings || "-";
      },
    },
    {
      id: "actions",
      header: t("recipes.table.actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/{-$locale}/recipes/$recipeId"
              params={{
                recipeId: row.original.id.toString(),
                locale: currentLocale === "en" ? undefined : currentLocale,
              }}
            >
              <Eye className="size-4 md:mr-1.5" />
              <span className="hidden md:inline">{t("recipes.view")}</span>
            </Link>
          </Button>
          {canEdit && (
            <Button asChild variant="ghost" size="sm">
              <Link
                to="/{-$locale}/recipes/$recipeId/edit"
                params={{
                  recipeId: row.original.id.toString(),
                  locale: currentLocale === "en" ? undefined : currentLocale,
                }}
              >
                <Pencil className="size-4 md:mr-1.5" />
                <span className="hidden md:inline">{t("common.edit")}</span>
              </Link>
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
    },
  ];

  // Custom filter function that searches across multiple fields and applies all filters
  const globalFilterFn: FilterFn<RecipeWithId> = (
    row,
    _columnId,
    filterValue
  ) => {
    const recipe = row.original;

    // filterValue is the combinedFilter object
    const filters =
      typeof filterValue === "object" && filterValue !== null
        ? (filterValue as {
            search: string;
            tags: Array<string>;
            cuisine: string;
            cookTime: string;
          })
        : { search: "", tags: [] as Array<string>, cuisine: "", cookTime: "" };

    // Apply tags filter (recipe must have ALL selected tags)
    if (filters.tags.length > 0) {
      if (!recipe.tags || !Array.isArray(recipe.tags)) {
        return false;
      }
      const hasAllTags = filters.tags.every((tag) =>
        recipe.tags?.includes(tag)
      );
      if (!hasAllTags) {
        return false;
      }
    }

    // Apply cuisine filter
    if (filters.cuisine) {
      if (recipe.cuisine !== filters.cuisine) {
        return false;
      }
    }

    // Apply cook time filter
    if (filters.cookTime) {
      const range = COOK_TIME_RANGES.find((r) => r.value === filters.cookTime);
      if (range) {
        const cookTime = recipe.cookTime;
        if (cookTime == null || cookTime < range.min || cookTime > range.max) {
          return false;
        }
      }
    }

    // Apply global text search
    const searchTerm = filters.search?.toLowerCase() || "";
    if (!searchTerm) return true;

    // Search in title
    if (recipe.title?.toLowerCase().includes(searchTerm)) return true;

    // Search in description
    if (recipe.description?.toLowerCase().includes(searchTerm)) return true;

    // Search in tags
    if (recipe.tags && Array.isArray(recipe.tags)) {
      if (recipe.tags.some((tag) => tag?.toLowerCase().includes(searchTerm)))
        return true;
    }

    // Search in ingredients
    if (recipe.ingredients) {
      for (const ing of recipe.ingredients) {
        if (ing.name?.toLowerCase().includes(searchTerm)) return true;
        if (ing.amount?.toLowerCase().includes(searchTerm)) return true;
        if (ing.unit?.toLowerCase().includes(searchTerm)) return true;
        if (ing.notes?.toLowerCase().includes(searchTerm)) return true;
      }
    }

    // Search in instructions
    if (recipe.instructions) {
      for (const inst of recipe.instructions) {
        if (inst.instruction?.toLowerCase().includes(searchTerm)) return true;
      }
    }

    // Search in cuisine
    if (recipe.cuisine?.toLowerCase().includes(searchTerm)) return true;

    return false;
  };

  const table = useReactTable({
    data: recipes as Array<RecipeWithId>,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter: combinedFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t("recipes.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("recipes.error")}: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const rows = table.getRowModel().rows;
  const isFiltered = hasActiveFilters;
  const emptyMessage = isFiltered
    ? t("recipes.noFilterResults")
    : t("recipes.noRecipes");

  return (
    <div className="space-y-3">
      {/* Search and filters */}
      <div className="flex flex-col gap-3">
        {/* Search input row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Input
            type="text"
            placeholder={t("recipes.search")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full max-w-sm"
          />
          <div className="text-sm text-muted-foreground shrink-0">
            {table.getFilteredRowModel().rows.length}{" "}
            {table.getFilteredRowModel().rows.length !== 1
              ? t("recipes.table.recipes")
              : t("recipes.table.recipe")}
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tags filter (multi-select) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] h-9 rounded-lg text-sm justify-between font-normal"
              >
                <span className="truncate">
                  {tagFilter.length === 0
                    ? t("recipes.filters.allTags")
                    : tagFilter.length === 1
                      ? tagFilter[0]
                      : `${tagFilter.length} ${t("recipes.filters.tagsSelected")}`}
                </span>
                <ChevronDown className="size-4 opacity-50 shrink-0 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto">
              {uniqueTags.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {t("recipes.filters.noTags")}
                </div>
              ) : (
                uniqueTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={tagFilter.includes(tag)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTagFilter([...tagFilter, tag]);
                      } else {
                        setTagFilter(
                          tagFilter.filter((tagItem) => tagItem !== tag)
                        );
                      }
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cuisine filter */}
          <Select
            value={cuisineFilter}
            onValueChange={(value: string) =>
              setCuisineFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[160px] h-9 rounded-lg text-sm">
              <SelectValue placeholder={t("recipes.filters.allCuisines")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("recipes.filters.allCuisines")}
              </SelectItem>
              {uniqueCuisines.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cook time filter */}
          <Select
            value={cookTimeFilter}
            onValueChange={(value: string) =>
              setCookTimeFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[240px] h-9  rounded-lg text-sm">
              <SelectValue placeholder={t("recipes.filters.allCookTimes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("recipes.filters.allCookTimes")}
              </SelectItem>
              <SelectItem value="under15">
                {t("recipes.filters.under15")}
              </SelectItem>
              <SelectItem value="15to30">
                {t("recipes.filters.15to30")}
              </SelectItem>
              <SelectItem value="30to60">
                {t("recipes.filters.30to60")}
              </SelectItem>
              <SelectItem value="over60">
                {t("recipes.filters.over60")}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4 mr-1" />
              {t("recipes.filters.clearFilters")}
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("recipes.filters.activeFilters")}:
            </span>
            {/* Tag filters */}
            {tagFilter.map((tag) => (
              <span
                key={`tag-${tag}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
              >
                <span className="text-xs text-muted-foreground">
                  {t("recipes.filters.tags")}:
                </span>
                {tag}
                <button
                  type="button"
                  onClick={() =>
                    setTagFilter(tagFilter.filter((tagItem) => tagItem !== tag))
                  }
                  className="ml-0.5 hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {/* Cuisine filter */}
            {cuisineFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                <span className="text-xs text-muted-foreground">
                  {t("recipes.filters.cuisine")}:
                </span>
                {cuisineFilter}
                <button
                  type="button"
                  onClick={() => setCuisineFilter("")}
                  className="ml-0.5 hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {/* Cook time filter */}
            {cookTimeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                <span className="text-xs text-muted-foreground">
                  {t("recipes.filters.cookTime")}:
                </span>
                {t(`recipes.filters.${cookTimeFilter}`)}
                <button
                  type="button"
                  onClick={() => setCookTimeFilter("")}
                  className="ml-0.5 hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-1.5">
        {rows.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">
            {emptyMessage}
          </p>
        ) : (
          rows.map((row) => {
            const r = row.original;
            const imageUrl = r.imageBlobUrl || r.sourceImageUrl;
            return (
              <Card
                key={row.id}
                variant="compact"
                className="overflow-hidden transition-colors active:bg-muted/50"
              >
                <div
                  className="flex gap-2 p-2"
                  onClick={() =>
                    navigate({
                      to: "/{-$locale}/recipes/$recipeId",
                      params: {
                        recipeId: r.id.toString(),
                        locale:
                          currentLocale === "en" ? undefined : currentLocale,
                      },
                    })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.currentTarget as HTMLElement).click()
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={r.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {t("recipes.table.noImage")}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {r.description || "-"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 size-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t("recipes.table.actions")}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          to="/{-$locale}/recipes/$recipeId"
                          params={{
                            recipeId: r.id.toString(),
                            locale:
                              currentLocale === "en"
                                ? undefined
                                : currentLocale,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="size-4 mr-2" />
                          {t("recipes.view")}
                        </Link>
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem asChild>
                          <Link
                            to="/{-$locale}/recipes/$recipeId/edit"
                            params={{
                              recipeId: r.id.toString(),
                              locale:
                                currentLocale === "en"
                                  ? undefined
                                  : currentLocale,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="size-4 mr-2" />
                            {t("common.edit")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop card grid: 2 cols on md, 3 on xl */}
      <div className="hidden md:block">
        {rows.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rows.map((row) => {
              const r = row.original;
              const difficulty = r.difficulty;
              const difficultyColors = {
                easy: "text-green-600",
                medium: "text-yellow-600",
                hard: "text-red-600",
              };
              const difficultyColor = difficulty
                ? difficultyColors[difficulty] || "text-muted-foreground"
                : "";
              const servingsRelevant = r.servingsRelevant !== false;

              return (
                <Card
                  key={row.id}
                  className="group relative px-3 py-2.5 flex flex-col transition-colors hover:bg-muted/40 cursor-pointer"
                  variant="normal"
                  onClick={() =>
                    navigate({
                      to: "/{-$locale}/recipes/$recipeId",
                      params: {
                        recipeId: r.id.toString(),
                        locale:
                          currentLocale === "en" ? undefined : currentLocale,
                      },
                    })
                  }
                >
                  <h3 className="font-semibold text-md text-foreground leading-snug mb-0.5">
                    {r.title}
                  </h3>

                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {r.description}
                    </p>
                  )}

                  {r.cuisine && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <UtensilsCrossed className="size-3 shrink-0" />
                      <span>{r.cuisine}</span>
                    </div>
                  )}

                  <TooltipProvider>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {difficulty && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`flex items-center gap-1 font-medium ${difficultyColor}`}
                            >
                              <ChefHat className="size-3" />
                              {difficulty.charAt(0).toUpperCase() +
                                difficulty.slice(1)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("recipes.table.difficulty")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {r.prepTime != null && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {r.prepTime} {t("common.minutes")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("recipes.table.prepTime")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {r.cookTime != null && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              <Flame className="size-3" />
                              {r.cookTime} {t("common.minutes")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("recipes.table.cookTime")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {servingsRelevant && r.servings != null && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              {r.servings}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("recipes.table.servings")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination - shared for mobile cards and desktop table */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-3">
          <div className="flex items-center justify-center gap-2 sm:justify-start flex-wrap">
            <Button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              {t("recipes.table.first")}
            </Button>
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              size="sm"
            >
              {t("recipes.table.previous")}
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {t("recipes.table.page")}{" "}
              <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
              {t("recipes.table.of")} {table.getPageCount()}
            </span>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              variant="outline"
              size="sm"
            >
              {t("recipes.table.next")}
            </Button>
            <Button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              {t("recipes.table.last")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
