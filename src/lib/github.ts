import { db } from "@/server/db"
import { Octokit } from "octokit"
import axios from "axios"
import { aiSummariseCommit } from "./gemini"

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

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
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

    return sortedCommits.slice(0,10).map((commit: any) => ({
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
    const summaryResponse = await Promise.allSettled(unprocessedCommits.map((commit)=>{
        return summariseCommit(githubUrl, commit.commitHash)
    }))
    const summaries = summaryResponse.map((response, index) => {
        if (response.status === "fulfilled") {
            return response.value as string
        }
        return "Error summarising commit"
    })

    const commits = await db.commit.createMany({
        data: summaries.map((summary, index) => {
            console.log(`processing commit ${index}`)
            return {
                projectId: projectId,
                commitHash: unprocessedCommits[index]!.commitHash,
                commitMessage: unprocessedCommits[index]!.commitMessage,
                commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                commitDate: new Date(unprocessedCommits[index]!.commitDate),
                summary
            }
        }),
        skipDuplicates: true
    })
    return commits
}

async function summariseCommit(githubUrl: string, commitHash: string) {
    //get the diff then pass it to the AI model
    const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
        headers: {
            Accept: "application/vnd.github.v3.diff",
        },
    })
    return await aiSummariseCommit(data) || "No summary available"
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