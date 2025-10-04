import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import "./home.css";
import type { Route } from "./+types/home";
import type { Post } from "~/types";
import { BlogPosts } from "~/components/blog-posts";
import { TopProjects } from "~/components/top-projects";
import { ProfileCard } from "~/components/profile-card";
import { ContactCard } from "~/components/contact-card";
import { fetchGitHubProjects } from "~/services/github";
import { repoUrls, languageColors } from "~/lib/constants";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Connor Young - Portfolio" },
    { name: "description", content: "Full-stack developer and software engineer portfolio" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {

  const projects = await fetchGitHubProjects(repoUrls, context.cloudflare.env.GITHUB_TOKEN);

  return { projects };
}

export default function Home() {
  const { projects } = useLoaderData<typeof loader>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/posts.json');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const postsData = await response.json() as Post[];
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, []);



  return (
    <div className="min-h-screen text-gray-100">
      <div className="mx-auto w-[90vw] max-w-7xl py-8">

        <div className="mx-auto grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_4fr)_minmax(0,_3fr)]">
          <div className="space-y-8">
            <ProfileCard />
            <ContactCard />
          </div>

          <div className="space-y-6">
            {postsLoading ? (
              <section className="card-surface rounded-md p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-white">Latest Blog Posts</h2>
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400">Loading posts...</div>
                </div>
              </section>
            ) : (
              <BlogPosts posts={posts} />
            )}
          </div>

          <div className="space-y-8">
            <TopProjects projects={projects} languageColors={languageColors} />
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
