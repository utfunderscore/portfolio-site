import type { ProjectSummary, GitHubRepoResponse } from "~/types";

export const createGitHubHeaders = () => {
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

export const fetchGitHubProjects = async (repoUrls: string[]): Promise<ProjectSummary[]> => {
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
  return projects;
};
