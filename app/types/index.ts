export type ProjectSummary = {
  name: string;
  description: string;
  stars: number;
  topics: string[];
  languages: string[];
  url: string;
};

export type Post = {
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
};

export type GitHubRepoResponse = {
  name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  language: string | null;
  languages_url?: string;
  topics?: string[];
};
