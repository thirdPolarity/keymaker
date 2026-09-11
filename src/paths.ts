const basePath = import.meta.env?.BASE_URL ?? "/";

export function relativePath(pathname: string, base = basePath): string {
  const prefix = base.replace(/\/$/, "");
  const path = prefix && (pathname === prefix || pathname.startsWith(prefix + "/"))
    ? pathname.slice(prefix.length) : pathname;
  return path.replace(/\/$/, "") || "/";
}
export function currentRoute(): string { return relativePath(window.location.pathname); }
export function pageUrl(route: string, base = basePath): string {
  return base.replace(/\/$/, "") + "/" + route.replace(/^\//, "");
}
