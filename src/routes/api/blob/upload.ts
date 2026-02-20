import { createFileRoute } from "@tanstack/react-router";
import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";

export const Route = createFileRoute("/api/blob/upload")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { auth } = await import("~/lib/auth");

        const session = await auth.api.getSession({ headers: request.headers });
        const user = session?.user as
          | { id?: string; role?: string }
          | undefined;
        if (!user || user.role !== "superadmin") {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: HandleUploadBody;
        try {
          body = (await request.json()) as HandleUploadBody;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const jsonResponse = await handleUpload({
            body,
            request,
            // API requires Promise return; no await needed
            // eslint-disable-next-line @typescript-eslint/require-await
            onBeforeGenerateToken: async (
              pathname,
              _clientPayload,
              _multipart
            ) => ({
              allowedContentTypes: [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
              ],
              addRandomSuffix: true,
              tokenPayload: JSON.stringify({ userId: user.id }),
            }),
            onUploadCompleted: async () => {
              // Optional: run logic after upload (e.g. update DB). Recipe is created later via extractRecipeFromImageUrl.
            },
          });
          return new Response(JSON.stringify(jsonResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
