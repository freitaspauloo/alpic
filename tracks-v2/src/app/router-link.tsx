import { forwardRef, type ComponentPropsWithRef, type ReactElement } from "react";
import { Link, useHref, useLinkClickHandler, type To } from "react-router-dom";
import { ButtonLink, type ButtonLinkProps } from "@/components/motion/button/base";

export interface RouterButtonLinkProps extends Omit<ButtonLinkProps, "href"> {
  to: To;
  replace?: boolean;
}

/** beUI `ButtonLink` that navigates client-side through react-router. */
export const RouterButtonLink = forwardRef<HTMLAnchorElement, RouterButtonLinkProps>(function RouterButtonLink(
  { to, replace, target, onClick, ...props },
  ref,
) {
  const href = useHref(to);
  const navigate = useLinkClickHandler<HTMLAnchorElement>(to, { replace, target });
  return (
    <ButtonLink
      ref={ref}
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) navigate(event);
      }}
      {...props}
    />
  );
});

/** For beUI parts with a `render` prop (e.g. `BreadcrumbLink`): `render={routerLink("/acme/runs")}`. */
export function routerLink(to: To) {
  return function RenderRouterLink(props: ComponentPropsWithRef<"a">): ReactElement {
    return <Link to={to} {...props} />;
  };
}
