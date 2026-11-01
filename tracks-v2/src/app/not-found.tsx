import { NotFoundStacked } from "@/components/motion/not-found/stacked";
import { cn } from "@/lib/utils";

/** Full-screen 404. Pass `embedded` inside the shell so it fills the inset instead of the viewport. */
export function NotFoundPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <main className={cn("flex items-center justify-center bg-background", embedded ? "flex-1 py-16" : "min-h-svh")}>
      <NotFoundStacked
        title="Page not found"
        description="This page moved, or the link is wrong."
        homeHref="/"
        homeLabel="Back home"
        browseHref="/acme/experiments"
        browseLabel="Open experiments"
      />
    </main>
  );
}
