'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/trpc/react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type FormInput = {
    repoUrl: string
    projectName: string
    githubToken?: string
}

const CreateProject = () => {
    const { register, handleSubmit, reset } = useForm<FormInput>()
    const createProject = api.project.createProject.useMutation()
    function onSubmit(data: FormInput) {
        console.log(data)
        createProject.mutate({
            githubUrl: data.repoUrl,
            name: data.projectName,
            githubToken: data.githubToken,
        }, {
            onSuccess: () => {
                toast.success('Project created successfully')
                reset()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    }
    
    return (
    <div className='flex justify-center items-center min-h-[calc(100vh-10rem)] gap-12'>
        <img src='/undraw_version-control_e4yu.svg' className='h-56 w-auto'/>
        <div>
        <div>
            <h1 className='font-semibold text-2xl'>Link your Github Repository</h1>
            <p className='text-sm text-muted-foreground'>Enter the URL of your repository to link it to github saas</p>
        </div>
        <div className='p-4'>
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                <Input {...register('projectName', {required: true})} placeholder='Project Name' required />
                <Input {...register('repoUrl', {required: true})} placeholder='Repo Url' required />
                <Input {...register('githubToken')} placeholder='Github Token (Optional)' />
                <Button type='submit' disabled={createProject.isPending}>Create Project</Button>
            </form>
        </div>
        </div>
    </div>
  )
}

export default CreateProject