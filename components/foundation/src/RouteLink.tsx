import type { HTMLAttributes, MouseEvent, Ref } from "react";
import { followRouteLink } from "./routing";

export type RouteLinkProps = Omit<HTMLAttributes<HTMLElement>, "onClick"> & {
  /** The view's URL (`hrefFor(view)`). Undefined: renders a `<button type="button">`. */
  href?: string;
  /** In-page navigation: plain clicks run it, modified clicks open the URL natively. */
  onFollow: () => void;
  /** Link: `aria-disabled`, out of the Tab order, clicks ignored. Button: `disabled`. */
  disabled?: boolean;
  ref?: Ref<HTMLElement>;
};

/**
 * A control that moves a modal to another view (tile, tab, pager, step):
 * a real `<a href>` when the view has a URL, so crawlers and new tabs follow
 * it, with the in-page handler on a plain click; a button otherwise.
 */
export function RouteLink({ href, onFollow, disabled = false, ref, children, ...rest }: RouteLinkProps) {
  if (href === undefined) {
    return (
      <button {...rest} ref={ref as Ref<HTMLButtonElement>} type="button" disabled={disabled} onClick={onFollow}>
        {children}
      </button>
    );
  }
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    followRouteLink(event, onFollow);
  };
  return (
    <a {...rest} ref={ref as Ref<HTMLAnchorElement>} href={href} onClick={onClick} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : rest.tabIndex}>
      {children}
    </a>
  );
}
