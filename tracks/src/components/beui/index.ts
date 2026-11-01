/**
 * Tracks-facing imports for the beUI design system.
 * Install additions with: npx shadcn@latest add @beui/<slug> --yes
 * @see https://beui.dev/docs/ai-agents
 */

export { AISidebar, type AISidebarProps, type SidebarResource } from "@/components/agents/ai-sidebar";
export {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
  useAnimatedSidebar,
} from "@/components/motion/animated-sidebar";
export { Button, buttonVariants } from "@/components/ui/button";
export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/motion/card";
export { Checkbox } from "@/components/motion/checkbox";
export { Input } from "@/components/motion/input";
export { Table, type TableColumn, type TableProps, type SortState } from "@/components/motion/table";
