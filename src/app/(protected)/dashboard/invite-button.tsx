'use-client'

import { Button } from '@/components/ui/button';
import { DialogHeader, Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useProject from '@/hooks/use-project';
import React from 'react'
import { toast } from 'sonner';

const InviteButton = () => {
    const {projectId} = useProject();
    const [open, setOpen] = React.useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className='text-lg font-semibold'>
                    Invite Members to Project
                </DialogTitle>
            </DialogHeader>
            <p>Copy and paste this link to invite members to the project:</p>
            <Input 
                className='mt-4'
                readOnly
                onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${projectId}`)
                    toast.success('Invite link copied to clipboard')
                }}
                value={`${window.location.origin}/join/${projectId}`}
            />
        </DialogContent>
      </Dialog>
      <Button 
        size='sm' 
        variant='outline' 
        onClick={() => setOpen(true)}
        className='border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white'
      >
        Invite Members
      </Button>
    </>
  )
}

export default InviteButton