import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useRecipe, useUpdateRecipe } from "~/hooks/useRecipes";
import { UpdateRecipeSchema } from "~/types/recipe";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";
import { authMiddleware } from "~/middleware/auth";
import { useAuth } from "~/hooks/useAuth";

export const Route = createFileRoute("/{-$locale}/recipes/$recipeId/edit")({
  server: {
    middleware: [authMiddleware],
  },
  component: EditRecipe,
});

function EditRecipe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = Route.useParams();
  const recipeId = params.recipeId;
  // Get locale from URL params (inherited from parent route)
  const allParams = useParams({ strict: false });
  const currentLocale = allParams.locale || "en";

  const { data: recipe, isLoading, isError } = useRecipe(Number(recipeId));
  const updateRecipe = useUpdateRecipe();

  const [formData, setFormData] = useState<z.infer<
    typeof UpdateRecipeSchema
  > | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || "",
        description: recipe.description || undefined,
        prepTime: recipe.prepTime || undefined,
        cookTime: recipe.cookTime || undefined,
        totalTime: recipe.totalTime || undefined,
        servings: recipe.servings || undefined,
        servingsRelevant:
          recipe.servingsRelevant !== undefined
            ? recipe.servingsRelevant
            : true,
        difficulty:
          (recipe.difficulty as "easy" | "medium" | "hard" | undefined) ||
          undefined,
        cuisine: recipe.cuisine || undefined,
        tags: recipe.tags || undefined,
        source: recipe.source || undefined,
        ingredients:
          recipe.ingredients?.map((ing) => ({
            name: ing.name,
            identifier: ing.identifier || undefined,
            amount: ing.amount || undefined,
            unit: ing.unit || undefined,
            notes: ing.notes || undefined,
            order: ing.order ?? 0,
          })) || [],
        instructions:
          recipe.instructions?.map((inst) => ({
            step: inst.step,
            instruction: inst.instruction,
            imageUrl: inst.imageUrl || undefined,
          })) || [],
      });
    }
  }, [recipe]);

  const handleIngredientChange = (
    index: number,
    field: "name" | "identifier" | "amount" | "unit" | "notes" | "order",
    value: any
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.ingredients) return null;
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      return { ...prev, ingredients: newIngredients };
    });
  };

  const addIngredient = () => {
    setFormData((prev) => {
      if (!prev) return null;
      const currentIngredients = prev.ingredients || [];
      const newIngredients = [
        ...currentIngredients,
        { name: "", order: currentIngredients.length },
      ];
      return { ...prev, ingredients: newIngredients };
    });
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => {
      if (!prev || !prev.ingredients) return null;
      const newIngredients = prev.ingredients.filter((_, i) => i !== index);
      return {
        ...prev,
        ingredients: newIngredients.map((ing, i) => ({ ...ing, order: i })),
      };
    });
  };

  const handleInstructionChange = (
    index: number,
    field: "step" | "instruction" | "imageUrl",
    value: any
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.instructions) return null;
      const newInstructions = [...prev.instructions];
      newInstructions[index] = { ...newInstructions[index], [field]: value };
      return { ...prev, instructions: newInstructions };
    });
  };

  const addInstruction = () => {
    setFormData((prev) => {
      if (!prev) return null;
      const currentInstructions = prev.instructions || [];
      const newInstructions = [
        ...currentInstructions,
        { step: currentInstructions.length + 1, instruction: "" },
      ];
      return { ...prev, instructions: newInstructions };
    });
  };

  const removeInstruction = (index: number) => {
    setFormData((prev) => {
      if (!prev || !prev.instructions) return null;
      const newInstructions = prev.instructions.filter((_, i) => i !== index);
      return {
        ...prev,
        instructions: newInstructions.map((inst, i) => ({
          ...inst,
          step: i + 1,
        })),
      };
    });
  };

  const changeCuisine = (value: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, cuisine: value };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const validation = UpdateRecipeSchema.safeParse(formData);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path.join(".")] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setErrors({});

      updateRecipe.mutate(
        { id: Number(recipeId), data: formData },
        {
          onSuccess: () => {
            navigate({
              to: "/{-$locale}/recipes/$recipeId",
              params: {
                locale: currentLocale === "en" ? undefined : currentLocale,
                recipeId,
              },
            });
          },
          onError: (error) => {
            setErrors({ submit: error.message || t("editRecipe.submitError") });
          },
        }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path.join(".")] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ submit: t("common.unexpectedError") });
      }
    }
  };

  if (isLoading || !recipe || !formData) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              <p className="font-medium">{t("editRecipe.errorLoading")}</p>
              <p className="mt-2">{t("editRecipe.notFound")}</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() =>
              navigate({
                to: "/{-$locale}/recipes/$recipeId",
                params: {
                  locale: currentLocale === "en" ? undefined : currentLocale,
                  recipeId,
                },
              })
            }
            className="mb-4"
          >
            ← {t("editRecipe.backToRecipe")}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {t("editRecipe.title")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("editRecipe.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("editRecipe.titleLabel")} *</Label>
                <Input
                  type="text"
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t("editRecipe.descriptionLabel")}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value || undefined,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">{t("editRecipe.tagsLabel")}</Label>
                <Input
                  type="text"
                  id="tags"
                  placeholder={t("editRecipe.tagsLabel")}
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) => {
                    const tags = e.target.value
                      ? e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      : undefined;
                    setFormData({ ...formData, tags });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("editRecipe.tagsHint")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine">{t("editRecipe.cuisineLabel")}</Label>
                <Input
                  type="text"
                  id="cuisine"
                  value={formData.cuisine || ""}
                  onChange={(e) => changeCuisine(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servings">
                  {t("editRecipe.servingsLabel")}
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    id="servings"
                    value={formData.servings || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        servings: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-32"
                    min="1"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="servingsRelevant"
                      checked={formData.servingsRelevant !== false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          servingsRelevant: checked === true,
                        })
                      }
                    />
                    <Label
                      htmlFor="servingsRelevant"
                      className="text-sm font-normal cursor-pointer"
                    >
                      {t("editRecipe.servingsRelevant")}
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("editRecipe.servingsHint")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("recipe.ingredients")}</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                >
                  {t("editRecipe.addIngredient")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.ingredients && formData.ingredients.length > 0 ? (
                <div className="space-y-4">
                  {/* Header row with labels */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Label className="flex-1 text-sm font-medium text-muted-foreground">
                      {t("common.name")}
                    </Label>
                    <Label className="w-32 text-sm font-medium text-muted-foreground">
                      {t("common.identifier")}
                    </Label>
                    <Label className="w-24 text-sm font-medium text-muted-foreground">
                      {t("common.amount")}
                    </Label>
                    <Label className="w-24 text-sm font-medium text-muted-foreground">
                      {t("common.unit")}
                    </Label>
                    <Label className="flex-1 text-sm font-medium text-muted-foreground">
                      {t("common.notes")}
                    </Label>
                    <div className="w-11"></div>
                  </div>
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) =>
                          handleIngredientChange(index, "name", e.target.value)
                        }
                        required
                        className="flex-1"
                      />
                      <Input
                        type="text"
                        placeholder="e.g., flour"
                        value={ingredient.identifier || ""}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "identifier",
                            e.target.value || undefined
                          )
                        }
                        className="w-32"
                      />
                      <Input
                        type="text"
                        value={ingredient.amount || ""}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "amount",
                            e.target.value || undefined
                          )
                        }
                        className="w-24"
                      />
                      <Input
                        type="text"
                        value={ingredient.unit || ""}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "unit",
                            e.target.value || undefined
                          )
                        }
                        className="w-24"
                      />
                      <Input
                        type="text"
                        value={ingredient.notes || ""}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "notes",
                            e.target.value || undefined
                          )
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("editRecipe.noIngredients")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("recipe.instructions")}</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstruction}
                >
                  {t("editRecipe.addInstruction")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.instructions && formData.instructions.length > 0 ? (
                <div className="space-y-4">
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mt-1 text-lg">
                        {instruction.step}
                      </span>
                      <Textarea
                        placeholder={t("common.instruction")}
                        value={instruction.instruction}
                        onChange={(e) =>
                          handleInstructionChange(
                            index,
                            "instruction",
                            e.target.value
                          )
                        }
                        rows={3}
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInstruction(index)}
                        className="text-destructive hover:text-destructive mt-1"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("editRecipe.noInstructions")}
                </p>
              )}
            </CardContent>
          </Card>

          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/{-$locale}/recipes/$recipeId",
                  params: {
                    locale: currentLocale === "en" ? undefined : currentLocale,
                    recipeId,
                  },
                })
              }
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateRecipe.isPending}>
              {updateRecipe.isPending
                ? t("editRecipe.saving")
                : t("editRecipe.saveChanges")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
