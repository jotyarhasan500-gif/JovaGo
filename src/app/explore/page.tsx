import { getPosts } from "@/app/actions/posts";
import { ExplorePostsClient } from "./explore-posts-client";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const initialPosts = await getPosts();
  return <ExplorePostsClient initialPosts={initialPosts} />;
}
