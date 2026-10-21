import type { APIRoute } from "astro";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_LANGUAGE = "en-US";

type JsonObject = Record<string, unknown>;

const json = (payload: JsonObject, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

const isValidId = (value: string): boolean => /^\d{1,12}$/.test(value);

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const accessTokenValue = env.TMDB_READ_ACCESS_TOKEN;
  const accessToken =
    typeof accessTokenValue === "string" ? accessTokenValue.trim() : "";

  if (!accessToken) {
    return json(
      {
        error:
          "TMDB token is missing. Add TMDB_READ_ACCESS_TOKEN to the project-root .env file and restart the development server.",
      },
      503,
    );
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "trending";
  const requestedPage = Number.parseInt(
    url.searchParams.get("page") || "1",
    10,
  );
  const page = Number.isFinite(requestedPage)
    ? Math.min(500, Math.max(1, requestedPage))
    : 1;

  const params = new URLSearchParams({ language: DEFAULT_LANGUAGE });
  let path = "";
  let providerRegion = "IN";

  switch (mode) {
    case "trending":
      path = "/trending/movie/week";
      params.set("page", String(page));
      break;
    case "popular":
      path = "/movie/popular";
      params.set("page", String(page));
      break;
    case "top_rated":
      path = "/movie/top_rated";
      params.set("page", String(page));
      break;
    case "upcoming":
      path = "/movie/upcoming";
      params.set("page", String(page));
      break;
    case "search": {
      const query = url.searchParams.get("q")?.trim();
      if (!query) return json({ error: "Enter a movie title to search." }, 400);
      path = "/search/movie";
      params.set("query", query.slice(0, 120));
      params.set("include_adult", "false");
      params.set("page", String(page));
      break;
    }
    case "genre": {
      const genreId = url.searchParams.get("id") || "";
      if (!/^\d{1,8}$/.test(genreId)) {
        return json({ error: "Choose a valid movie genre." }, 400);
      }
      path = "/discover/movie";
      params.set("with_genres", genreId);
      params.set("include_adult", "false");
      params.set("sort_by", "popularity.desc");
      params.set("page", String(page));
      break;
    }
    case "genres":
      path = "/genre/movie/list";
      break;
    case "regions":
      path = "/watch/providers/regions";
      break;
    case "details":
    case "reviews":
    case "providers": {
      const id = url.searchParams.get("id") || "";
      const mediaType = url.searchParams.get("type") === "tv" ? "tv" : "movie";

      if (!isValidId(id)) {
        return json({ error: "Choose a valid movie or series." }, 400);
      }

      if (mode === "reviews") {
        if (mediaType !== "movie") {
          return json(
            { error: "TMDB review lookup currently supports movies only." },
            400,
          );
        }
        path = `/movie/${id}/reviews`;
        params.set("page", String(page));
      } else if (mode === "providers") {
        providerRegion = (url.searchParams.get("region") || "IN").toUpperCase();
        if (!/^[A-Z]{2}$/.test(providerRegion)) {
          return json({ error: "Choose a valid country or region." }, 400);
        }
        path = `/${mediaType}/${id}/watch/providers`;
      } else {
        path = `/${mediaType}/${id}`;
      }
      break;
    }
    default:
      return json({ error: "Unsupported MovieFlex request mode." }, 400);
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}${path}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return json(
          {
            error:
              "TMDB rejected the access token. Verify TMDB_READ_ACCESS_TOKEN in .env, then restart the development server.",
          },
          502,
        );
      }

      return json(
        {
          error: `TMDB request failed (${response.status}). Try again shortly.`,
        },
        response.status >= 400 && response.status < 600 ? response.status : 502,
      );
    }

    const payload = (await response.json()) as JsonObject;

    if (mode === "providers") {
      const results =
        payload.results && typeof payload.results === "object"
          ? (payload.results as Record<string, unknown>)
          : {};
      return json({
        region: providerRegion,
        availability: results[providerRegion] ?? null,
      });
    }

    return json(payload);
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return json(
      {
        error: timedOut
          ? "TMDB took too long to respond. Try again."
          : "TMDB could not be reached. Check your internet connection and try again.",
      },
      502,
    );
  }
};
