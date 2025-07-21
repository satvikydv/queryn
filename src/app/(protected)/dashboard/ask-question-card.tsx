"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogHeader, Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import { GithubIcon } from 'lucide-react'
import React from 'react'
import { askQuestion } from './actions'
import { readStreamableValue } from 'ai/rsc'

function AskQuestionCard() {
    const {project} = useProject()
    const [question, setQuestion] = React.useState('')
    const [open, setOpen] = React.useState(false)
    const [ loading, setLoading ] = React.useState(false)
    const [filesReferences, setFilesReferences] = React.useState<{fileName: string; sourceCode: string; summary: string}[]>([])
    const [answer, setAnswer] = React.useState('')


    const onSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
        if(!project?.id) return
        e.preventDefault()
        // window.alert(question)
        setLoading(true)
        setOpen(true)

        const {output, filesReferences} = await askQuestion(question, project.id)
        setFilesReferences(filesReferences)

        for await (const delta of readStreamableValue(output)){
          if(delta){
            setAnswer(ans => ans + delta)
          }
        }
        setLoading(false)
    }


  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <GithubIcon className='size-5 mr-2 inline-block' />
            </DialogTitle>
          </DialogHeader>
            {answer}
            <h1>File References</h1>
            {filesReferences.map(file => {
              return <span>{file.fileName}</span>
            })}
        </DialogContent>
      </Dialog>
      <Card className='relative col-span-2'>
        <CardHeader>
          <CardTitle>
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea placeholder="Ask a question about your project..." value={question} onChange={e => setQuestion(e.target.value)} />
            <div className="h-4"></div>
            <Button type='submit'>
              Ask
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AskQuestionCard