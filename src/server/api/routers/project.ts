import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
    //this is the endpoint for creating a project
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async ({ctx, input}) => {
        const project = await ctx.prisma.project.create({
            data: {
                name: input.name,
                githubUrl: input.githubUrl,
                UserToProject: {
                    create:{
                        userId: ctx.user.userId!,
                    }
                }
            }
        })
        return project
    }),

    //this is the endpoint for getting all projects
    getProjects: protectedProcedure.query(async ({ctx}) => {
        return await ctx.prisma.project.findMany({
            where: {
                UserToProject: {
                    some: {
                        userId: ctx.user.userId!,
                    }
                },
                deletedAt: null,
            },
            include: {
                UserToProject: true,
            }
        })
    })
})