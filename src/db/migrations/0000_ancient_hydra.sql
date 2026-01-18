CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer,
	"name" text NOT NULL,
	"amount" text,
	"unit" text,
	"notes" text,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "instructions" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer,
	"step" integer NOT NULL,
	"instruction" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "nutrition" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer,
	"calories" integer,
	"protein" integer,
	"carbs" integer,
	"fat" integer,
	"fiber" integer,
	"sugar" integer,
	"sodium" integer
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"prep_time" integer,
	"cook_time" integer,
	"total_time" integer,
	"servings" integer,
	"difficulty" text,
	"cuisine" text,
	"tags" text[],
	"source" text,
	"source_image_url" text,
	"image_blob_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition" ADD CONSTRAINT "nutrition_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;