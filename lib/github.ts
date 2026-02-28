import axios from "axios";

const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};

export async function fetchRepoFiles(repoUrl: string): Promise<string> {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const owner = match[1];
  const repo = match[2].replace(".git", "");

  const treeRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers }
  );

  const files = treeRes.data.tree
    .filter((f: any) =>
      f.type === "blob" &&
      (f.path.endsWith(".ts") || f.path.endsWith(".js") || f.path.endsWith(".py") || f.path.endsWith(".tsx")) &&
      f.size < 50000
    )
    .slice(0, 5);

  let combined = "";

  for (const file of files) {
    const contentRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
      { headers }
    );
    const decoded = Buffer.from(contentRes.data.content, "base64").toString("utf-8");
    combined += `\n\n// FILE: ${file.path}\n${decoded}`;
  }

  return combined;
}
