import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/home";

const repoUrls = [
  "https://github.com/utfunderscore/matchmaker-rs",
  "https://github.com/utfunderscore/ui-toolkit",
  "https://github.com/utfunderscore/hermes",
  "https://github.com/utfunderscore/loadbalancer-rs",
  "https://github.com/utfunderscore/game",
];

type ProjectSummary = {
  name: string;
  description: string;
  stars: number;
  topics: string[];
  languages: string[];
  url: string;
};

type Post = {
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
};

type GitHubRepoResponse = {
  name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  language: string | null;
  languages_url?: string;
  topics?: string[];
};

const createGitHubHeaders = () => {
  const baseHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "connor-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = typeof process !== "undefined" ? process.env?.GITHUB_TOKEN : undefined;

  if (token && token.length > 0) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
};

const parseRepositorySlug = (url: string) => {
  const { pathname } = new URL(url);
  const segments = pathname.replace(/^\/+/, "").split("/");

  if (segments.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  const [owner, repo] = segments as [string, string];
  return { owner, repo: repo.replace(/\.git$/, "") };
};

const fallbackProject = (url: string, repo: string, description?: string): ProjectSummary => ({
  name: repo,
  description: description ?? "Repository details are currently unavailable.",
  stars: 0,
  topics: [],
  languages: [],
  url,
});

const toPascalCase = (value: string) => {
  const tokens = value
    .replace(/[_\-]+/g, " ")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return value;
  }

  return tokens
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join("");
};

const languageColors: Record<string, string> = {
  rust: "#dea584",
  kotlin: "#a97bff",
  java: "#b07219",
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572a5",
  go: "#00add8",
  ruby: "#701516",
  swift: "#ffac45",
  php: "#4f5d95",
  "c++": "#f34b7d",
  "c#": "#178600",
  "c": "#555555",
  shell: "#89e051",
  html: "#e34c26",
  css: "#563d7c",
  scala: "#c22d40",
  dart: "#00b4ab",
  elixir: "#6e4a7e",
  sql: "#e38c00",
  r: "#198ce7",
  lua: "#000080",
  svelte: "#ff3e00",
  vue: "#41b883",
  angular: "#c3002f",
  "objective-c": "#438eff",
  hcl: "#5c4ee5",
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace(/^#/, "");

  if (![3, 6].includes(normalized.length)) {
    return `rgba(15, 23, 42, ${alpha})`;
  }

  const fullHex = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;

  const [r, g, b] = [
    parseInt(fullHex.slice(0, 2), 16),
    parseInt(fullHex.slice(2, 4), 16),
    parseInt(fullHex.slice(4, 6), 16),
  ];

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Connor Young - Portfolio" },
    { name: "description", content: "Full-stack developer and software engineer portfolio" },
  ];
}

const formatDate = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export async function loader({}: Route.LoaderArgs) {
  const headers = createGitHubHeaders();
  const projects = await Promise.all(
    repoUrls.map(async (url) => {
      const { owner, repo } = parseRepositorySlug(url);

      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers,
        });

        if (response.status === 404) {
          return fallbackProject(url, repo, "Repository is private or does not exist.");
        }

        if (!response.ok) {
          throw new Error(`GitHub API responded with ${response.status}`);
        }

        const data = (await response.json()) as GitHubRepoResponse;

        let languages: string[] = [];

        if (data.languages_url) {
          try {
            const languagesResponse = await fetch(data.languages_url, { headers });

            if (languagesResponse.ok) {
              const languageData = (await languagesResponse.json()) as Record<string, number>;
              languages = Object.entries(languageData)
                .sort(([, bytesA], [, bytesB]) => bytesB - bytesA)
                .map(([languageName]) => languageName);
            }
          } catch (languagesError) {
            if (import.meta.env.DEV) {
              console.warn(`Failed to load languages for ${owner}/${repo}`, languagesError);
            }
          }
        }

        if (!languages.length && data.language) {
          languages = [data.language];
        }

        return {
          name: data.name ?? repo,
          description: data.description ?? "No description provided yet.",
          stars: data.stargazers_count ?? 0,
          topics: data.topics ?? [],
          languages,
          url: data.html_url ?? url,
        } satisfies ProjectSummary;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(`Failed to load repository ${owner}/${repo}`, error);
        }

        return fallbackProject(url, repo);
      }
    })
  );

  projects.sort((a, b) => b.stars - a.stars);

  // Load posts from JSON file
  let posts: Post[] = [];
  try {
    // In SSR context, we need to read from the file system instead of making HTTP requests
    if (typeof process !== 'undefined') {
      // Server-side: read file directly
      const fs = await import('fs/promises');
      const path = await import('path');
      const postsPath = path.join(process.cwd(), 'public', 'posts.json');
      const postsContent = await fs.readFile(postsPath, 'utf-8');
      posts = JSON.parse(postsContent) as Post[];
    } else {
      // Client-side: fetch from public URL
      const postsResponse = await fetch('/posts.json');
      if (postsResponse.ok) {
        posts = await postsResponse.json() as Post[];
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load posts from JSON file', error);
    }
    // Fallback to empty array if loading fails
    posts = [];
  }

  return { projects, posts };
}

export default function Home() {
  const { projects, posts } = useLoaderData<typeof loader>();
  const [cardOpacity, setCardOpacity] = useState(0.5);
  const [cardBlur, setCardBlur] = useState(6);
  const showIslandControls = import.meta.env.VITE_SHOW_ISLAND_CONTROLS === "true";

  const cardSurfaceStyle = useMemo(() => {
    const normalized = Math.min(Math.max(cardOpacity, 0.1), 0.95);
    const borderAlpha = Math.max(0.04, normalized * 0.12);
    const noiseAlpha = Math.max(0.12, normalized * 0.35);

    return {
      "--card-opacity": normalized.toString(),
      "--card-border-opacity": borderAlpha.toString(),
      "--card-noise-opacity": noiseAlpha.toString(),
      "--card-blur": `${cardBlur}px`,
    } as CSSProperties;
  }, [cardOpacity, cardBlur]);
  const skills = [
    "Java",
    "Kotlin",
    "Rust",
    "Kubernetes",
    "Linux",
    "Spring Boot",
    "gRPC",
    "Python",
    "Docker",
  ];

  const skillStyles: Record<string, { base: string; text: string }> = {
    Java: { base: "#f89920", text: "#fefce8" },
    Kotlin: { base: "#7f52ff", text: "#f5f3ff" },
    Rust: { base: "#dea584", text: "#fff7ed" },
    Kubernetes: { base: "#326ce5", text: "#e0f2fe" },
    Linux: { base: "#fcc624", text: "#fefce8" },
    "Spring Boot": { base: "#6db33f", text: "#ecfdf5" },
    gRPC: { base: "#5c9f55", text: "#ecfdf5" },
    Python: { base: "#3776ab", text: "#e0f2fe" },
    Docker: { base: "#0db7ed", text: "#e0f2fe" },
  };

  return (
    <div className="min-h-screen text-gray-100">
      <div className="mx-auto w-[90vw] max-w-7xl py-8">
        {showIslandControls && (
          <section
            className="card-surface mb-8 rounded-md p-4 shadow-lg"
            style={cardSurfaceStyle}
            aria-label="Island transparency control"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                  Island Transparency (alpha)
                </span>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
                  <span>Opacity: {cardOpacity.toFixed(2)}</span>
                  <span className="hidden sm:inline">Transparency: {(1 - cardOpacity).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="island-opacity"
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.01}
                  value={cardOpacity}
                  onChange={(event) => setCardOpacity(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#a97bff]"
                />
                <label htmlFor="island-opacity" className="text-xs text-gray-400">
                  {Math.round(cardOpacity * 100)}%
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                  Island Blur
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="island-blur"
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={cardBlur}
                  onChange={(event) => setCardBlur(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#a97bff]"
                />
                <label htmlFor="island-blur" className="text-xs text-gray-400">
                  {cardBlur}px
                </label>
              </div>
            </div>
          </section>
        )}
        <div className="mx-auto grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_4fr)_minmax(0,_3fr)]">
          <div className="space-y-8">
            <section className="card-surface rounded-md p-6 shadow-lg" style={cardSurfaceStyle}>
              <h1 className="mb-4 text-3xl font-bold text-white">Connor Young</h1>
              <p className="mb-6 leading-relaxed text-gray-300">
                Backend software developer focusing on scalable infrastructure for game services. 
                I have extensive experience building backend services, matchmaking systems, and building
                game services for kubernetes.
              </p>
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => {
                    const { base, text } = skillStyles[skill] ?? {
                      base: "#14b8a6",
                      text: "#ecfeff",
                    };

                    return (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-md border px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: hexToRgba(base, 0.18),
                          borderColor: hexToRgba(base, 0.35),
                          color: text,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: base }}
                        />
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="card-surface rounded-md p-6 shadow-lg" style={cardSurfaceStyle}>
              <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href="mailto:connor675756@gmail.com" className="text-[#a97bff] hover:underline">
                    Email
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <a
                    href="https://github.com/utfunderscore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#a97bff] hover:underline"
                  >
                    GitHub
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                  </svg>
                  <a
                    href="https://linkedin.com/in/connoryoung"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#a97bff] hover:underline"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="card-surface rounded-md p-6 shadow-lg" style={cardSurfaceStyle}>
              <h2 className="mb-6 text-2xl font-bold text-white">Latest Blog Posts</h2>
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post.title} className="border-b border-neutral-800 pb-6 last:border-b-0">
                    <h3 className="mb-2 cursor-pointer text-lg font-semibold text-white transition hover:text-[#a97bff]">
                      {post.title}
                    </h3>
                    <p className="mb-3 text-sm text-gray-400">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span key={tag} className="rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(post.date)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="card-surface rounded-md p-6 shadow-lg" style={cardSurfaceStyle}>
              <h3 className="mb-4 text-lg font-semibold text-white">Top Projects</h3>
              <div className="space-y-4">
                {projects.map((project) => {
                  type LabelToken = { label: string; color?: string | null };
                  const seen = new Set<string>();

                  const rawLabels: LabelToken[] = project.languages.map((language) => ({
                      label: toPascalCase(language),
                      color: languageColors[language.toLowerCase()] ?? null,
                    }));

                  const labels = rawLabels.filter(({ label }) => {
                    const key = label.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });

                  return (
                    <div key={project.url} className="space-y-3 border-l-4 border-[#a97bff] pl-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="font-medium text-white">{project.name}</h4>
                          <span
                            className="flex items-center gap-1 text-xs text-gray-500"
                            aria-label={`${project.stars.toLocaleString()} GitHub stars`}
                          >
                            <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.457a1 1 0 00-.364 1.118l1.287 3.97c.3.922-.755 1.688-1.538 1.118l-3.382-2.456a1 1 0 00-1.176 0l-3.382 2.456c-.783.57-1.838-.196-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.097 9.397c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.97z" />
                            </svg>
                            {project.stars.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{project.description}</p>
                      </div>
                      {labels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {labels.map(({ label, color }) => (
                            <span
                              key={label}
                              className="inline-flex items-center gap-2 rounded-md border border-teal-500/30 bg-teal-900/20 px-2 py-0.5 text-xs text-teal-200"
                            >
                              {color && (
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                  aria-hidden="true"
                                />
                              )}
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#a97bff] transition hover:text-[#a97bff]"
                      >
                        View on GitHub
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M11 3a1 1 0 100 2h2.586L8.293 10.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
        <footer className="mt-16 border-t border-gray-700 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-gray-400 sm:flex-row sm:text-left">
            <p>&copy; 2025 Connor Young. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
