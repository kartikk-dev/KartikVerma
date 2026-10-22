import type { APIRoute } from "astro";
import { get, list, put } from "@vercel/blob";

export const prerender = false;

const REVIEWS_PREFIX = "portfolio-reviews/";
const MAX_NAME_LENGTH = 60;
const MIN_REVIEW_LENGTH = 20;
const MAX_REVIEW_LENGTH = 1000;
const MAX_PUBLIC_REVIEWS = 100;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

type Review = {
  id: string;
  reviewer_name: string;
  review_text: string;
  status: "approved";
  created_at: string;
};

type RateEntry = { count: number; resetAt: number };
const rateStore = new Map<string, RateEntry>();

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeReview(value: unknown): Review | null {
  if (typeof value !== "object" || value === null) return null;

  const row = value as Record<string, unknown>;
  const reviewerName = cleanString(row.reviewer_name);
  const reviewText = cleanString(row.review_text);
  const createdAt = cleanString(row.created_at);
  const id = cleanString(row.id);

  if (
    !id ||
    reviewerName.length < 2 ||
    reviewerName.length > MAX_NAME_LENGTH ||
    reviewText.length < MIN_REVIEW_LENGTH ||
    reviewText.length > MAX_REVIEW_LENGTH ||
    row.status !== "approved"
  ) {
    return null;
  }

  return {
    id,
    reviewer_name: reviewerName,
    review_text: reviewText,
    status: "approved",
    created_at: createdAt || new Date(0).toISOString(),
  };
}

function rateLimitKey(request: Request): string {
  // Best-effort per-function-instance limit, not a globally shared rate limiter.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-client";
}

function isRateLimited(request: Request): boolean {
  const now = Date.now();
  const key = rateLimitKey(request);
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT) return true;
  current.count += 1;
  return false;
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async () => {
  try {
    const result = await list({ prefix: REVIEWS_PREFIX, limit: 1000 });
    const newest = [...result.blobs]
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, MAX_PUBLIC_REVIEWS);

    const reviews = await Promise.all(
      newest.map(async (blob): Promise<Review | null> => {
        try {
          const stored = await get(blob.pathname, {
            access: "private",
            useCache: false,
          });

          if (!stored || stored.statusCode !== 200 || !stored.stream) return null;
          const raw: unknown = await new Response(stored.stream).json();
          return safeReview(raw);
        } catch (error) {
          console.error("[Portfolio reviews] Could not read stored review.", error);
          return null;
        }
      }),
    );

    return json(
      reviews
        .filter((review): review is Review => review !== null)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  } catch (error) {
    console.error("[Portfolio reviews] Blob GET failed.", error);
    return json(
      { error: "The review service is not configured or is temporarily unavailable." },
      503,
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!isSameOrigin(request)) {
    return json({ error: "Cross-origin review submissions are not allowed." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "Please submit the review using the website form." }, 415);
  }

  const lengthHeader = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(lengthHeader) && lengthHeader > 12_000) {
    return json({ error: "The submission is too large." }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "The review submission was not valid JSON." }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return json({ error: "Please provide a valid review." }, 400);
  }

  const input = body as Record<string, unknown>;

  // Silent success discourages basic spam bots that fill in the hidden field.
  if (cleanString(input.website)) return json({ ok: true }, 202);

  if (isRateLimited(request)) {
    return json({ error: "Please wait a few minutes before submitting another review." }, 429);
  }

  const reviewerName = cleanString(input.reviewer_name);
  const reviewText = cleanString(input.review_text);
  const consent = input.publication_consent === true;

  if (reviewerName.length < 2 || reviewerName.length > MAX_NAME_LENGTH) {
    return json({ error: "Your name must be between 2 and 60 characters." }, 400);
  }

  if (reviewText.length < MIN_REVIEW_LENGTH || reviewText.length > MAX_REVIEW_LENGTH) {
    return json({ error: "Your review must be between 20 and 1000 characters." }, 400);
  }

  if (!consent) {
    return json({ error: "Please confirm that your review may be published." }, 400);
  }

  const review: Review = {
    id: crypto.randomUUID(),
    reviewer_name: reviewerName,
    review_text: reviewText,
    status: "approved",
    created_at: new Date().toISOString(),
  };

  try {
    // During local dev, Vite exposes the development token to this server-only route.
    // On Vercel, the Blob SDK can use the project's Vercel OIDC credentials automatically.
    const localReadWriteToken = import.meta.env.DEV
      ? import.meta.env.BLOB_READ_WRITE_TOKEN
      : undefined;
    const tokenOption = localReadWriteToken ? { token: localReadWriteToken } : {};

    await put(`${REVIEWS_PREFIX}${review.id}.json`, JSON.stringify(review), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json; charset=utf-8",
      ...tokenOption,
    });

    return json({ review }, 201);
  } catch (error) {
    console.error("[Portfolio reviews] Blob POST failed.", error);
    return json(
      { error: "Could not save your review. Check the Vercel Blob store setup and try again." },
      503,
    );
  }
};
