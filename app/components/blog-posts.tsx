import type { CSSProperties } from "react";

type Post = {
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
};

type BlogPostsProps = {
  posts: Post[];
  cardSurfaceStyle?: CSSProperties;
};

const formatDate = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export function BlogPosts({ posts, cardSurfaceStyle }: BlogPostsProps) {
  return (
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
  );
}
