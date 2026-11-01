import { Card, CardContent } from "@/components/motion/card";
import type { ReactNode } from "react";

export function AppEmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card variant="outlined" size="default" className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="max-w-md space-y-2 text-sm text-muted-foreground [&_p]:m-0">{children}</div>
      </CardContent>
    </Card>
  );
}
