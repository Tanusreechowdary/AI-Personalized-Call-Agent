import { timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function validSecret(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function withApiErrors(
  handler: (request: Request) => Promise<Response>,
  options: { requireApiKey?: boolean } = {},
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      if (options.requireApiKey !== false) {
        const apiSecret = process.env.APP_API_SECRET;
        if (!apiSecret && process.env.NODE_ENV === "production") {
          throw new HttpError("Configure APP_API_SECRET before exposing the API.", 503);
        }
        if (apiSecret) {
          const authorization = request.headers.get("authorization") ?? "";
          const bearer = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";
          const supplied =
            request.headers.get("x-relay-api-key") ?? bearer;
          if (!validSecret(apiSecret, supplied)) {
            throw new HttpError("API authentication is required.", 401);
          }
        }
      }
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return Response.json(
          {
            error: "Invalid request",
            details: error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          { status: 400 },
        );
      }
      if (error instanceof SyntaxError) {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
      }
      console.error("Unhandled API error", error);
      return Response.json(
        { error: "An unexpected server error occurred." },
        { status: 500 },
      );
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json();
}
