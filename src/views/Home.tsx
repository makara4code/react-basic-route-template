import { useEffect, useState } from "react";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  // http request, I/O: write/read file
  // offload
  // main thread(single threaded)
  const fetchPosts = async () => {
    // browser native fetch api
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await res.json();

    setPosts(data);
  };

  // useEffect(callback, dependencyArray)
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div>
      <h1>Home Page Component</h1>
      <h2>Data Fetching</h2>
      {/* unordered list */}
      <ol>
        {posts.map((post) => {
          return (
            <li key={post.id}>
              <p>ID: {post.id}</p>
              <p>UserID: {post.userId}</p>
              <h3>Title: {post.title}</h3>
              <p>Content: {post.body}</p>
            </li>
          );
        })}

        {/* sigle line return */}
        {/* {posts.map((item) => (
          <li>{item.title}</li>
        ))} */}
      </ol>
    </div>
  );
}
