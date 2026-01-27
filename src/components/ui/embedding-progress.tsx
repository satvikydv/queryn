"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface EmbeddingProgressProps {
  processed: number;
  total: number;
  currentFile: string;
  estimatedTimeRemaining: number; // in seconds
}

export function EmbeddingProgress({
  processed,
  total,
  currentFile,
  estimatedTimeRemaining,
}: EmbeddingProgressProps) {
  const percentage = Math.round((processed / total) * 100);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating Embeddings
        </CardTitle>
        <CardDescription>
          Processing your repository files with AI embeddings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Files Processed</span>
            <span className="text-2xl font-bold">
              {processed} <span className="text-muted-foreground">/ {total}</span>
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="text-center text-sm text-muted-foreground">
            {percentage}% complete
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <div className="text-sm text-muted-foreground">Currently processing:</div>
          <div className="font-mono text-xs bg-muted p-2 rounded truncate" title={currentFile}>
            {currentFile}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: We&apos;re using rate limiting to respect API limits. This ensures stable processing
            for large repositories.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
