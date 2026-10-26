
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

const REGISTRY = "https://registry.npmjs.org";
const DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week";
const SEARCH = "https://registry.npmjs.org/-/v1/search";

function getQuery(props) {
  if (typeof props.searchQuery === "string" && props.searchQuery.trim()) {
    return props.searchQuery;
  }

  if (typeof props.queryProps?.query === "string" && props.queryProps.query.trim()) {
    return props.queryProps.query;
  }

  const data = Array.isArray(props.searchData)
    ? props.searchData[0]
    : props.searchData;

  if (typeof data?.query === "string" && data.query.trim()) {
    return data.query;
  }

  return "";
}

function getIntent(query) {
  if (/\b(compare|versus|vs\.?)\b/i.test(query)) return "compare";
  if (/\b(alternatives?|packages like|similar to)\b/i.test(query)) {
    return "alternatives";
  }
  if (/\b(packages? for|npm search|find packages)\b/i.test(query)) {
    return "search";
  }
  return "details";
}

function cleanName(value) {
  return value
    .trim()
    .replace(/^[\s"'`]+|[\s"'`,.!?]+$/g, "")
    .replace(/\b(npm package info|package info|npm package|npm|packages?)\b/gi, "")
    .trim();
}

function getPackageNames(query) {
  const text = query
    .replace(/^.*?\bcompare\b/i, "")
    .replace(/\b(npm packages?|packages?)\b/gi, "")
    .trim();

  return text
    .split(/\s+(?:vs\.?|versus|and)\s+|,/i)
    .map(cleanName)
    .filter(Boolean)
    .slice(0, 3);
}

function getSearchTerm(query, intent) {
  let term = query;

  if (intent === "alternatives") {
    term = term.replace(
      /^.*?\b(?:alternatives?\s+(?:to|for)|packages?\s+(?:like|similar to))\b/i,
      ""
    );
  } else {
    term = term.replace(
      /^.*?\b(?:packages?\s+for|npm search|find packages)\b/i,
      ""
    );
  }

  return term.replace(/\bnpm\b/gi, "").trim();
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "Package or resource not found."
        : `Request failed (${response.status}). Please try again.`
    );
  }
  return response.json();
}

async function getPackage(name) {
  if (!name || /\s/.test(name)) {
    throw new Error(`"${name}" doesn't look like a valid package name.`);
  }

  const encodedName = encodeURIComponent(name);
  const [metadata, downloads] = await Promise.all([
    fetchJSON(`${REGISTRY}/${encodedName}`),
    fetchJSON(`${DOWNLOADS}/${encodedName}`).catch(() => null),
  ]);

  const version = metadata["dist-tags"]?.latest;
  const latest = version ? metadata.versions?.[version] : null;

  if (!latest) {
    throw new Error(`Latest version information is unavailable for ${name}.`);
  }

  const repository =
    typeof latest.repository === "string"
      ? latest.repository
      : latest.repository?.url;

  return {
    name: metadata.name || name,
    version,
    description: latest.description || "No description provided.",
    downloads: downloads?.downloads ?? null,
    releaseDate: metadata.time?.[version] || null,
    license:
      typeof latest.license === "string"
        ? latest.license
        : latest.license?.type || null,
    repository: repository?.replace(/^git\+/, "").replace(/\.git$/, "") || null,
    engines: latest.engines?.node || null,
    deprecated: latest.deprecated || null,
  };
}



async function searchPackages(term) {
  if (!term) {
    throw new Error("Enter a package name or use case to search.");
  }

  const originalName = term.trim().toLowerCase();

  const knownAlternatives = {
    moment: ["dayjs", "date-fns", "luxon"],
    axios: ["got", "ky", "ofetch"],
    express: ["fastify", "koa", "hono"],
    lodash: ["remeda", "radash", "underscore"],
  };

  const candidates = knownAlternatives[originalName];

  if (candidates) {
    const results = await Promise.allSettled(
      candidates.map((name) => getPackage(name))
    );

    return results
      .filter((result) => result.status === "fulfilled")
      .map(({ value: pkg }) => ({
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        weeklyDownloads: pkg.downloads,
        license: pkg.license,
        deprecated: pkg.deprecated,
        repository: pkg.repository,
      }));
  }

  const url = `${SEARCH}?text=${encodeURIComponent(term)}&size=25`;
  const result = await fetchJSON(url);
  const seen = new Set();

  return (result.objects || [])
    .map(({ package: pkg }) => ({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || "No description provided.",
      weeklyDownloads: pkg.downloads?.weekly ?? null,
      license: pkg.license || null,
      deprecated: pkg.deprecated || null,
      repository: pkg.links?.repository || null,
    }))
    .filter((pkg) => {
      const name = pkg.name.toLowerCase();

      if (name === originalName || seen.has(name)) {
        return false;
      }

      seen.add(name);
      return true;
    })
    .slice(0, 12);
}



function formatDate(date) {
  if (!date) return "Not provided";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Not provided"
    : parsed.toLocaleDateString();
}

function formatDownloads(value) {
  return value == null ? "Unavailable" : value.toLocaleString();
}

function Detail({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ overflowWrap: "anywhere" }} variant="body2">
        {value || "Not provided"}
      </Typography>
    </Box>
  );
}

function PackageCard({ pkg }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {pkg.name}
            </Typography>
            <Chip size="small" label={`v${pkg.version}`} />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {pkg.description}
          </Typography>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 2,
            }}
          >
            <Detail
              label="Weekly downloads"
              value={formatDownloads(pkg.downloads)}
            />
            <Detail label="License" value={pkg.license} />
            <Detail label="Latest release" value={formatDate(pkg.releaseDate)} />
            <Detail label="Node.js requirement" value={pkg.engines} />
          </Box>

          {pkg.repository && (
            <Typography
              component="a"
              href={pkg.repository}
              target="_blank"
              rel="noreferrer"
              variant="body2"
              sx={{ overflowWrap: "anywhere" }}
            >
              View repository
            </Typography>
          )}

          {pkg.deprecated && (
            <Alert severity="warning">
              Deprecated: {pkg.deprecated}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function NewComponent(props) {
  const query = getQuery(props);
  const intent = getIntent(query);
  const loadedNotified = useRef(false);
  const [loading, setLoading] = useState(Boolean(query.trim()));
  const [error, setError] = useState("");
  const [packages, setPackages] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setPackages([]);
      setResults([]);

      try {
        if (!query.trim()) return;

        if (intent === "compare") {
          const names = getPackageNames(query);

          if (names.length < 2) {
            throw new Error(
              "Please specify at least two package names, for example: compare react and vue."
            );
          }

          const responses = await Promise.allSettled(names.map(getPackage));
          const successful = responses
            .filter((item) => item.status === "fulfilled")
            .map((item) => item.value);
          const failed = responses
            .filter((item) => item.status === "rejected")
            .map((item) => item.reason?.message || "A package could not be loaded.");

          if (cancelled) return;
          setPackages(successful);

          if (failed.length) {
            setError(failed.join(" "));
          }
          if (!successful.length) {
            throw new Error("No package details could be loaded.");
          }
        } else if (intent === "alternatives" || intent === "search") {
          const term = getSearchTerm(query, intent);
          const found = await searchPackages(term);

          if (cancelled) return;
          setResults(found);

          if (!found.length) {
            setError("No matching packages were found.");
          }
        } else {
          let name = query
            .replace(/^(please\s+)?(show me\s+)?/i, "")
            .replace(/^what is the license for\s+/i, "")
            .replace(/^the latest version of\s+/i, "")
            .replace(/^(latest|current) version of\s+/i, "")
            .replace(/^(npm package info|package info|npm package|npm)\s+/i, "")
            .replace(/[?!.]+$/g, "")
            .trim();

          const pkg = await getPackage(name);

          if (cancelled) return;
          setPackages([pkg]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [query, intent]);

  useEffect(() => {
    if (!loading && !loadedNotified.current) {
      loadedNotified.current = true;
      props?.messageHandlers?.componentLoaded?.();
    }
  }, [loading, props?.messageHandlers]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            PackageLens
          </Typography>
          <Typography color="text.secondary">
            Explore npm packages, compare tools, and discover alternatives.
          </Typography>
        </Box>

        {query && (
          <Typography variant="body2" color="text.secondary">
            Query: {query}
          </Typography>
        )}

        {!query && (
          <Alert severity="info">
            Try “npm package info react”, “compare react and vue”, or
            “alternatives to moment”.
          </Alert>
        )}

        {loading && (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CircularProgress size={22} />
            <Typography>Fetching live npm package data…</Typography>
          </Stack>
        )}

        {Boolean(error) && <Alert severity="warning">{error}</Alert>}

        {packages.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={700}>
              {intent === "compare" ? "Package comparison" : "Package details"}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  packages.length > 1
                    ? "repeat(auto-fit, minmax(min(100%, 280px), 1fr))"
                    : "minmax(0, 1fr)",
                gap: 2,
              }}
            >
              {packages.map((pkg) => (
                <PackageCard key={pkg.name} pkg={pkg} />
              ))}
            </Box>
          </>
        )}

        {results.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={700}>
              {intent === "alternatives" ? "Suggested alternatives" : "Matching packages"}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                gap: 2,
              }}
            >
              {results.map((pkg) => (
                <Card
                  key={pkg.name}
                  variant="outlined"
                  sx={{ borderRadius: 3 }}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h6" fontWeight={700}>
                        {pkg.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`v${pkg.version}`}
                        sx={{ alignSelf: "flex-start" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {pkg.description}
                      </Typography>
                      <Divider />
                      <Detail
                        label="Weekly downloads"
                        value={formatDownloads(pkg.weeklyDownloads)}
                      />
                      <Detail label="License" value={pkg.license} />
                      {pkg.repository && (
                        <Typography
                          component="a"
                          href={pkg.repository}
                          target="_blank"
                          rel="noreferrer"
                          variant="body2"
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          View repository
                        </Typography>
                      )}
                      {pkg.deprecated && (
                        <Alert severity="warning">
                          Deprecated: {pkg.deprecated}
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}

export default NewComponent;
