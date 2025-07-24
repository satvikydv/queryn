import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";

export const projectRouter = createTRPCRouter({
  //this is the endpoint for creating a project
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          UserToProject: {
            create: {
              userId: ctx.user.userId!,
            },
          },
        },
      });

      await indexGithubRepo(project.id, input.githubUrl, input.githubToken);
      // Poll commits from the GitHub repository
      await pollCommits(project.id);
      return project;
    }),

  //this is the endpoint for getting all projects
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        UserToProject: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: null,
      },
      include: {
        UserToProject: true,
      },
    });
  }),

  //this is the endpoint for getting the commit history of a project
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // pollCommits(input.projectId).then().catch(console.error)
      return await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
      });
    }),

    saveAnswer: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.any()
      })).mutation(async ({ ctx, input }) =>{
        return await ctx.db.question.create({
          data: {
            projectId: input.projectId,
            question: input.question,
            answer: input.answer,
            filesReferences: input.filesReferences,
            userId: ctx.user.userId!,
          }
        })
      })
});
