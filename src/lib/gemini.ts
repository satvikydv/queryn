import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const aiSummariseCommit = async (diff: string) => {
  // https://github.com/docker/genai-stack/commit/<commitHash>.diff
  const response = await model.generateContent([
    `
You are an expert software engineer and commit summarizer.

You will be given a raw Git diff of a commit. Your task is to summarize the changes in plain, concise English. Focus on **what was changed and why**, not how the code looks.

Some reminders about the Git diff format:

For every file, there are a few metadata lines, like (for example):

\`\`\`
diff --git a/lib/index.js b/lib/index.js
index a0df691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`

This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.

Then there is a specifier of the lines that were modified.
- A line starting with \`+\` means it was **added**.
- A line starting with \`-\` means that line was **deleted**.
- A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding. It is not part of the diff.

[...more lines may follow in a real diff...]

---

EXAMPLE SUMMARY COMMENTS:
- Raised the amount of returned recordings from \`10\` to \`100\`
- Fixed a typo in the GitHub action name
- Moved the \`octokit\` initialization to a separate file
- Added an OpenAI API for completions
- Lowered numeric tolerance for test files

Most commits will have **fewer comments** than this examples list.
The last comment does not include the file names.
Do not include parts of the example in your summary.

It is given only as an example of **appropriate comments**.

---

Please summarise the following diff file:

\`\`\`diff
${diff}
\`\`\`
`,
  ]);

  return response.response.text();
};
