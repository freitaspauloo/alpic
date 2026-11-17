import { Link } from "react-router-dom";
import { Page } from "@/app/page-layout";
import { Card, CARD_TARGET_CLASS, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/motion/card";
import { useOrgData } from "@/data";
import { resolveNavIcon } from "@/design/icons";
import { useDesign } from "@/design/theme";
import { IconTile, plural } from "./shared";

const SECTIONS = [
  {
    id: "repositories",
    title: "Repositories",
    to: "repositories",
    description: "Start your variants' runs from codebases representative of your users.",
    one: "repository",
    many: "repositories",
  },
  {
    id: "skills",
    title: "Skills",
    to: "skills",
    description: "Give the agent instructions on how to interact with your product.",
    one: "skill",
    many: "skills",
  },
  {
    id: "mcp-servers",
    title: "MCP servers",
    to: "mcp-servers",
    description: "Give the agent access to your MCP server.",
    one: "server",
    many: "servers",
  },
  {
    id: "command-line-tools",
    title: "Command-line tools",
    to: "command-line-tools",
    description: "Install a program in your runs by adding it to the agent tools.",
    one: "tool",
    many: "tools",
  },
] as const;

export function LibraryHub() {
  const { orgId, repositories, skills, mcpServers, tools } = useOrgData();
  const icons = useDesign().icons;
  const counts: Record<(typeof SECTIONS)[number]["id"], number> = {
    repositories: repositories.length,
    skills: skills.length,
    "mcp-servers": mcpServers.length,
    "command-line-tools": tools.length,
  };

  return (
    <Page title="Library" description="What agents can use when they run: codebases, instructions, servers, and tools.">
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = resolveNavIcon(section.id, icons);
          return (
            <Card key={section.id} interactive>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <IconTile icon={Icon} strokeWidth={icons.strokeWidth} />
                  <CardTitle as="h2">
                    <Link to={`/${orgId}/library/${section.to}`} className={CARD_TARGET_CLASS}>
                      {section.title}
                    </Link>
                  </CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <span className="text-xs text-muted-foreground">{plural(counts[section.id], section.one, section.many)}</span>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
