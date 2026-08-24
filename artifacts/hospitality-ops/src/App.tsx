import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Route, Router as WouterRouter, Switch, Redirect, useLocation } from 'wouter';

import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/app-shell';
import { DashboardPage } from '@/pages/dashboard';
import { GuestPage } from '@/pages/guest';
import { LandingPage } from '@/pages/landing';
import { RequestsPage } from '@/pages/requests';
import { TablesPage } from '@/pages/tables';
import { StaffDashboardPage } from '@/pages/staff';
import { AdminPage } from '@/pages/admin';
import { DemoPage } from '@/pages/demo';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || publishableKeyFromHost(window.location.hostname, '');
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#0F172A',
    colorForeground: '#0F172A',
    colorMutedForeground: '#64748B',
    colorDanger: '#EF4444',
    colorBackground: '#FFFFFF',
    colorInput: '#F8FAFC',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.75rem',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function AuthPage({ type }: { type: 'sign-in' | 'sign-up' }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-display text-2xl font-black">S</span>
          <span className="font-extrabold text-slate-900 text-xl tracking-tight">SilentServe</span>
        </div>
        {type === 'sign-in' ? (
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        ) : (
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        )}
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  return isSignedIn ? <Redirect to="/admin" /> : <LandingPage />;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <AppShell>{children}</AppShell>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function SignOutAwareRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/demo" component={DemoPage} />
      <Route path="/sign-in/*?" component={() => <AuthPage type="sign-in" />} />
      <Route path="/sign-up/*?" component={() => <AuthPage type="sign-up" />} />

      {/* Public Guest Routes */}
      <Route path="/g/:businessSlug/:locationId/:servicePointId" component={GuestPage} />
      <Route path="/guest/:businessSlug/:tableCode" component={GuestPage} />

      {/* Staff Realtime Dashboard */}
      <Route path="/staff" component={StaffDashboardPage} />

      {/* Admin / Manager Dashboard */}
      <Route path="/admin/*?" component={() => <Protected><AdminPage /></Protected>} />
      <Route path="/dashboard" component={() => <Protected><DashboardPage /></Protected>} />
      <Route path="/requests" component={() => <Protected><RequestsPage /></Protected>} />
      <Route path="/tables" component={() => <Protected><TablesPage /></Protected>} />

      {/* Super Admin Placeholder */}
      <Route path="/super-admin" component={() => (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-black mb-2">SilentServe SaaS Platform Owner</h1>
          <p className="text-slate-400 max-w-md">Multi-tenant subscription management, business provisioning, and platform analytics portal.</p>
        </div>
      )} />

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey || 'pk_test_placeholder'}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <SignOutAwareRoutes />
        </RoutedErrorBoundary>
        <Toaster richColors closeButton position="top-right" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
