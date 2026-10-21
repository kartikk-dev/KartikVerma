
// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import { cwd } from "node:process";
import vercel from "@astrojs/vercel";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_LANGUAGE = "en-US";

// This middleware is used only by the local Vite development server.
const env = loadEnv("development", cwd(), "");
const accessToken = env.TMDB_READ_ACCESS_TOKEN?.trim();

export default defineConfig({
  adapter: vercel(),

  vite: {
    plugins: [
      {
        name: "movieflex-tmdb-dev-api",

        /** @param {import("vite").ViteDevServer} server */
        configureServer(server) {
          /**
           * @param {import("node:http").IncomingMessage} req
           * @param {import("node:http").ServerResponse} res
           * @param {(err?: any) => void} next
           */
          const middleware = (req, res, next) => {
            /** @returns {Promise<void>} */
            const handleRequest = async () => {
              const url = new URL(req.url || "/", "http://localhost");

              if (url.pathname !== "/api/movieflex") {
                next();
                return;
              }

              /** @param {number} status @param {unknown} payload */
              const respond = (status, payload) => {
                res.statusCode = status;
                res.setHeader(
                  "Content-Type",
                  "application/json; charset=utf-8",
                );
                res.setHeader("Cache-Control", "no-store");
                res.setHeader("X-Content-Type-Options", "nosniff");
                res.end(JSON.stringify(payload) ?? "null");
              };

              const address = req.socket?.remoteAddress ?? "";
              const isLocalRequest = [
                "::1",
                "127.0.0.1",
                "::ffff:127.0.0.1",
              ].includes(address);

              if (!isLocalRequest) {
                respond(403, {
                  error:
                    "The MovieFlex development API is available only on this machine.",
                });
                return;
              }

              if (req.method !== "GET") {
                res.setHeader("Allow", "GET");
                respond(405, {
                  error: "Only GET requests are supported.",
                });
                return;
              }

              if (!accessToken) {
                respond(503, {
                  error:
                    "TMDB token is missing. Add TMDB_READ_ACCESS_TOKEN to .env and restart npm run dev.",
                });
                return;
              }

              const mode = url.searchParams.get("mode") || "trending";
              const requestedPage = Number.parseInt(
                url.searchParams.get("page") || "1",
                10,
              );

              const page = Number.isFinite(requestedPage)
                ? Math.min(500, Math.max(1, requestedPage))
                : 1;

              const params = new URLSearchParams({
                language: DEFAULT_LANGUAGE,
              });

              let path = "";

              /** @type {((payload: any) => unknown) | null} */
              let localTransform = null;

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

                  if (!query) {
                    respond(400, {
                      error: "Enter a movie title to search.",
                    });
                    return;
                  }

                  path = "/search/movie";
                  params.set("query", query.slice(0, 120));
                  params.set("include_adult", "false");
                  params.set("page", String(page));
                  break;
                }

                case "genre": {
                  const genreId = url.searchParams.get("id") || "";

                  if (!/^\d{1,8}$/.test(genreId)) {
                    respond(400, {
                      error: "Choose a valid movie genre.",
                    });
                    return;
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
                  const mediaType =
                    url.searchParams.get("type") === "tv" ? "tv" : "movie";

                  if (!/^\d{1,12}$/.test(id)) {
                    respond(400, {
                      error: "Choose a valid movie or series.",
                    });
                    return;
                  }

                  if (mode === "reviews" && mediaType !== "movie") {
                    respond(400, {
                      error:
                        "TMDB review lookup currently supports movies in MovieFlex.",
                    });
                    return;
                  }

                  if (mode === "providers") {
                    const region = (
                      url.searchParams.get("region") || "IN"
                    ).toUpperCase();

                    if (!/^[A-Z]{2}$/.test(region)) {
                      respond(400, {
                        error: "Choose a valid country or region.",
                      });
                      return;
                    }

                    localTransform = (payload) => ({
                      region,
                      availability: payload?.results?.[region] || null,
                    });

                    path = `/${mediaType}/${id}/watch/providers`;
                  } else if (mode === "reviews") {
                    path = `/${mediaType}/${id}/reviews`;
                    params.set("page", String(page));
                  } else {
                    path = `/${mediaType}/${id}`;
                  }

                  break;
                }

                default:
                  respond(400, {
                    error: "Unsupported MovieFlex request mode.",
                  });
                  return;
              }

              try {
                const upstream = await fetch(
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

                if (!upstream.ok) {
                  const upstreamStatus = upstream.status;
                  const status =
                    upstreamStatus === 401 || upstreamStatus === 403
                      ? 502
                      : upstreamStatus;

                  respond(status, {
                    error:
                      upstreamStatus === 401 || upstreamStatus === 403
                        ? "TMDB rejected the access token. Check TMDB_READ_ACCESS_TOKEN in .env and restart the dev server."
                        : `TMDB request failed (${upstreamStatus}). Try again shortly.`,
                  });

                  return;
                }

                const payload = await upstream.json();

                respond(
                  200,
                  localTransform ? localTransform(payload) : payload,
                );
              } catch (error) {
                const errorName =
                  error instanceof Error ? error.name : "Error";

                const timedOut =
                  errorName === "TimeoutError" ||
                  errorName === "AbortError";

                server.config.logger.error(
                  `[MovieFlex] TMDB request failed (${errorName}).`,
                );

                respond(502, {
                  error: timedOut
                    ? "TMDB took too long to respond. Try again."
                    : "TMDB could not be reached. Check your internet connection and try again.",
                });
              }
            };

            handleRequest().catch((error) => {
              const message =
                error instanceof Error ? error.message : "Unknown error";

              server.config.logger.error(
                `[MovieFlex] Local API middleware failed: ${message}`,
              );

              if (res.writableEnded) return;

              res.statusCode = 500;
              res.setHeader(
                "Content-Type",
                "application/json; charset=utf-8",
              );
              res.setHeader("Cache-Control", "no-store");

              res.end(
                JSON.stringify({
                  error: "An unexpected MovieFlex API error occurred.",
                }),
              );
            });
          };

          server.middlewares.use(middleware);
        },
      },
    ],
  },
});
