import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppDialog({
  title,
  description,
  onClose,
  children,
  wide,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <CenterMorphModal open onOpenChange={(open) => !open && onClose()}>
      <CenterMorphModalContent
        ariaLabel={title}
        ariaDescribedBy={description ? "tracks-dialog-desc" : undefined}
        className={cn(
          "flex max-h-[min(88vh,720px)] w-[min(92vw,32rem)] flex-col gap-4 overflow-y-auto p-6",
          wide && "w-[min(92vw,42rem)]",
        )}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p id="tracks-dialog-desc" className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
