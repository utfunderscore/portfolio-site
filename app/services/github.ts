import type { ProjectSummary, GitHubRepoResponse } from "~/types";
import { cache, generateCacheKey, hashCacheKey } from "~/lib/cache";

export const createGitHubHeaders = (token: string) => {
  const baseHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "connor-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token && token.length > 0) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
};

export const parseRepositorySlug = (url: string) => {
  const { pathname } = new URL(url);
  const segments = pathname.replace(/^\/+/, "").split("/");

  if (segments.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  const [owner, repo] = segments as [string, string];
  return { owner, repo: repo.replace(/\.git$/, "") };
};

export const fallbackProject = (url: string, repo: string, description?: string): ProjectSummary => ({
  name: repo,
  description: description ?? "Repository details are currently unavailable.",
  stars: 0,
  topics: [],
  languages: [],
  url,
});

export const fetchGitHubProjects = async (repoUrls: string[], token: string): Promise<ProjectSummary[]> => {
  // Generate a cache key based on repo URLs and token hash
  const repoUrlsKey = repoUrls.sort().join(','); // Sort for consistent keys
  const tokenHash = hashCacheKey(token || 'no-token');
  const cacheKey = generateCacheKey('github-projects', tokenHash, hashCacheKey(repoUrlsKey));

  // Try to get from cache first
  const cachedProjects = cache.get<ProjectSummary[]>(cacheKey);
  if (cachedProjects) {
    if (import.meta.env.DEV) {
      console.log(`🎯 Using cached GitHub projects for ${repoUrls.length} repositories`);
    }
    return cachedProjects;
  }

  if (import.meta.env.DEV) {
    console.log(`🔄 Fetching fresh GitHub projects for ${repoUrls.length} repositories`);
  }

  const headers = createGitHubHeaders(token);
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
  
  // Cache the results for 30 minutes
  try {
    cache.set(cacheKey, projects, 30);
    if (import.meta.env.DEV) {
      console.log(`💾 Cached GitHub projects with key: ${cacheKey}`);
    }
  } catch (cacheError) {
    // Cache failures shouldn't break the main functionality
    if (import.meta.env.DEV) {
      console.warn('Failed to cache GitHub projects:', cacheError);
    }
  }

  return projects;
};

/**
 * Clear the GitHub projects cache (useful for development/debugging)
 */
export const clearGitHubProjectsCache = () => {
  cache.clear();
  if (import.meta.env.DEV) {
    console.log('🗑️ Cleared GitHub projects cache');
  }
};

/**
 * Get cache statistics for debugging
 */
export const getGitHubCacheStats = () => {
  const stats = cache.getStats();
  if (import.meta.env.DEV) {
    console.log('📊 GitHub cache stats:', stats);
  }
  return stats;
};
