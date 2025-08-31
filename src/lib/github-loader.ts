import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbeddingFromGemini, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { Octokit } from "octokit";

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || "",
    branch: "main",
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "README.md",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });
  const docs = await loader.load();
  return docs;
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);
  await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
    console.log(`processing file ${index+1} of ${allEmbeddings.length}`);
    if(!embedding) return

    const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
            projectId,
            fileName: embedding.fileName,
            summary: embedding.summary,
            sourceCode: embedding.sourceCode,
        },
    })

    // Update the embedding in the database
    await db.$executeRaw`
    UPDATE "SourceCodeEmbedding"
    SET "summaryEmbedding" = ${embedding.embedding}::vector
    WHERE "id" = ${sourceCodeEmbedding.id}
    `
  }))
};

const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        try {
            console.log(`Processing file: ${doc.metadata.source}`);
            const summary = await summariseCode(doc);
            
            if (!summary || summary.trim().length === 0) {
                console.warn(`Empty summary for file: ${doc.metadata.source}`);
                throw new Error(`Failed to generate summary for ${doc.metadata.source}`);
            }
            
            console.log(`Summary for ${doc.metadata.source}:`, summary.substring(0, 100) + '...');
            const embedding = await generateEmbeddingFromGemini(summary);
            
            return {
                summary,
                embedding,
                sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                fileName: doc.metadata.source,
            }
        } catch (error) {
            console.error(`Error processing file ${doc.metadata.source}:`, error);
            throw error; // Re-throw to handle at a higher level
        }
    }))
};

const getFileCount = async(path: string, octokit: Octokit, githubOwner: string, githubRepo: string, acc: number = 0)=>{
  const { data } = await octokit.rest.repos.getContent({
    owner: githubOwner,
    repo: githubRepo,
    path
  })
  if(!Array.isArray(data) && data.type === 'file'){
    return acc + 1;   //accumulator + 1
  }
  if(Array.isArray(data)){
    let fileCount = 0
    const directories: string[] = []

    for(const item of data){
      if(item.type === 'dir'){
        directories.push(item.path)
      } else {
        fileCount++;
      }
    }

    if(directories.length > 0){
      const directoryCounts = await Promise.all(
        directories.map(dirPath => getFileCount(dirPath, octokit, githubOwner, githubRepo, 0))
      )
      fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
    }
    return acc + fileCount;
  }
  return acc
}

export const checkCredits = async (githubUrl: string, githubToken?: string) => {
  //find out how many files are in the repo
  const octokit = new Octokit({ auth: githubToken });
  const githubOwner = githubUrl.split("/")[3];
  const githubRepo = githubUrl.split("/")[4];
  if(!githubOwner || !githubRepo){
    return 0;
  }
  const fileCount = await getFileCount('', octokit, githubOwner, githubRepo);
  return fileCount
}