import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { Home, TrendingUp, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import "@/i18n"; // initialize i18n

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a2540" },
      { title: "SmokeFree — Quit smoking, one day at a time" },
      {
        name: "description",
        content:
          "Track, reduce, and quit smoking gradually. SmokeFree calculates a personal weekly plan and shows your progress, money saved, and health milestones.",
      },
      { property: "og:title", content: "SmokeFree — Quit smoking gradually" },
      {
        property: "og:description",
        content: "A calm, minimal companion to help you quit smoking step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const items = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/progress", label: t("nav.progress"), icon: TrendingUp },
    { to: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ] as const;

  // Hide on onboarding
  if (pathname === "/onboarding") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className={active ? "text-primary font-medium" : "text-muted-foreground"}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RootComponent() {
  useEffect(() => {
    initAdMob();
  }, []);
  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

