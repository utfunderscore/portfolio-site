import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import type { Post } from "~/types";
import { BlogPosts } from "~/components/blog-posts";
import { TopProjects } from "~/components/top-projects";
import { ProfileCard } from "~/components/profile-card";
import { ContactCard } from "~/components/contact-card";
import { IslandControls } from "~/components/island-controls";
import { fetchGitHubProjects } from "~/services/github";
import { repoUrls, languageColors } from "~/lib/constants";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Connor Young - Portfolio" },
    { name: "description", content: "Full-stack developer and software engineer portfolio" },
  ];
}

export async function loader({ }: Route.LoaderArgs) {
  const projects = await fetchGitHubProjects(repoUrls);

  const fs = await import('fs/promises');
  const path = await import('path');
  const postsPath = path.join(process.cwd(), 'public', 'posts.json');
  const postsContent = await fs.readFile(postsPath, 'utf-8');
  let posts = JSON.parse(postsContent) as Post[];

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

  return (
    <div className="min-h-screen text-gray-100">
      <div className="mx-auto w-[90vw] max-w-7xl py-8">
        {showIslandControls && (
          <IslandControls
            cardOpacity={cardOpacity}
            cardBlur={cardBlur}
            onOpacityChange={setCardOpacity}
            onBlurChange={setCardBlur}
            cardSurfaceStyle={cardSurfaceStyle}
          />
        )}
        <div className="mx-auto grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_4fr)_minmax(0,_3fr)]">
          <div className="space-y-8">
            <ProfileCard cardSurfaceStyle={cardSurfaceStyle} />
            <ContactCard cardSurfaceStyle={cardSurfaceStyle} />
          </div>

          <div className="space-y-6">
            <BlogPosts posts={posts} cardSurfaceStyle={cardSurfaceStyle} />
          </div>

          <div className="space-y-8">
            <TopProjects projects={projects} cardSurfaceStyle={cardSurfaceStyle} languageColors={languageColors} />
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
