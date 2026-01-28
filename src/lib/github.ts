import { db } from "@/server/db"
import { Octokit } from "octokit"
import axios from "axios"
import { batchSummariseCommits } from "./groq"

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})

const githubUrl = "https://github.com/docker/genai-stack"

type Response = {
    commitHash: string,
    commitMessage: string,
    commitAuthorName: string,
    commitAuthorAvatar: string,
    commitDate: string,
}

export const getCommitHashes = async (githubUrl: string, limit: number = 10): Promise<Response[]> => {
    // https://github.com/docker/genai-stack
    const [ owner, repo ] = githubUrl.split("/").slice(-2)
    if (!owner || !repo) {
        throw new Error("Invalid GitHub URL")
    }
    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo
    })
    // console.log(data)
    const sortedCommits = data.sort((a: any, b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())

    return sortedCommits.slice(0, limit).map((commit: any) => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit.author?.avatar_url ?? "",
        commitDate: commit.commit?.author?.date ?? "",
    }))
}

export const pollCommits = async(projectId: string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId)
    if (!githubUrl) {
        throw new Error("Project does not have a GitHub URL")
    }
    const commitHashes = await getCommitHashes(githubUrl)
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes)
    
    // Fetch diffs for all unprocessed commits
    console.log(`Fetching diffs for ${unprocessedCommits.length} commits...`);
    const diffsToProcess = await Promise.all(
        unprocessedCommits.map(async (commit) => {
            try {
                const { data } = await axios.get(`${githubUrl}/commit/${commit.commitHash}.diff`, {
                    headers: {
                        Accept: "application/vnd.github.v3.diff",
                    },
                });
                return { diff: data, commitHash: commit.commitHash };
            } catch (error) {
                console.error(`Error fetching diff for ${commit.commitHash}:`, error);
                return { diff: "", commitHash: commit.commitHash };
            }
        })
    );
    
    // Batch process summaries with rate limiting
    console.log('Starting batch commit summary generation with rate limiting...');
    const summaryResults = await batchSummariseCommits(
        diffsToProcess,
        (processed, total) => {
            console.log(`Summarized commit ${processed}/${total}`);
        }
    );

    const commits = await db.commit.createMany({
        data: unprocessedCommits.map((commit, index) => {
            const summaryResult = summaryResults.find(r => r.commitHash === commit.commitHash);
            return {
                projectId: projectId,
                commitHash: commit.commitHash,
                commitMessage: commit.commitMessage,
                commitAuthorName: commit.commitAuthorName,
                commitAuthorAvatar: commit.commitAuthorAvatar,
                commitDate: new Date(commit.commitDate),
                summary: summaryResult?.summary || "Error summarizing commit"
            }
        }),
        skipDuplicates: true
    })
    return commits
}

async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: { id: projectId },
        select: {
            githubUrl: true,
        },
    })
    if(!project?.githubUrl){
        throw new Error("Project does not have a GitHub URL")
    }
    return { project, githubUrl: project?.githubUrl }
}

//filter unprocessed commits to avoid generating summaries for the same commit multiple times
async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({
        where: { projectId },
    })

    const unprocessedCommits = commitHashes.filter((commit=> !processedCommits.some((processedCommit) => processedCommit.commitHash === commit.commitHash)))
    return unprocessedCommits
}