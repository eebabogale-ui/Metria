import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Router as WouterRouter, Switch, Redirect, useLocation } from 'wouter';

import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/app-shell';
import { DashboardPage } from '@/pages/dashboard';
import { GuestPage } from '@/pages/guest';
import { LandingPage } from '@/pages/landing';
import { RequestsPage } from '@/pages/requests';
import { TablesPage } from '@/pages/tables';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

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
    colorPrimary: '#D38A27',
    colorForeground: '#17343C',
    colorMutedForeground: '#637277',
    colorDanger: '#B84A3E',
    colorBackground: '#FBF9F3',
    colorInput: '#F2EFE8',
    colorInputForeground: '#17343C',
    colorNeutral: '#D9D3C8',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.875rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#FBF9F3] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#17343C] font-semibold',
    headerSubtitle: 'text-[#637277]',
    socialButtonsBlockButtonText: 'text-[#17343C] font-semibold',
    formFieldLabel: 'text-[#17343C] font-semibold',
    footerActionLink: 'text-[#A96517] font-semibold',
    footerActionText: 'text-[#637277]',
    dividerText: 'text-[#637277]',
    identityPreviewEditButton: 'text-[#A96517]',
    formFieldSuccessText: 'text-[#2B7A5B]',
    alertText: 'text-[#B84A3E]',
    logoBox: 'mb-5',
    logoImage: 'h-10',
    socialButtonsBlockButton: 'border-[#D9D3C8] bg-[#F2EFE8] hover:bg-[#E9E3D8]',
    formButtonPrimary: 'bg-[#D38A27] text-[#17343C] hover:bg-[#B8731E]',
    formFieldInput: 'border-[#D9D3C8] bg-[#F2EFE8] text-[#17343C]',
    footerAction: 'border-t-0',
    dividerLine: 'bg-[#D9D3C8]',
    alert: 'border-[#E9B8B1] bg-[#FCEDEA]',
    otpCodeFieldInput: 'border-[#D9D3C8] bg-[#F2EFE8] text-[#17343C]',
    formFieldRow: 'mb-4',
    main: 'p-2',
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
  return <div className="noise flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-[440px]"><div className="mb-6 flex items-center justify-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-2xl font-semibold">H</span><span className="font-extrabold tracking-tight">harbor</span></div>{type === 'sign-in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></div>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  return isSignedIn ? <Redirect to="/dashboard" /> : <LandingPage />;
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
  return <Switch>
    <Route path="/" component={HomeRedirect} />
    <Route path="/sign-in/*?" component={() => <AuthPage type="sign-in" />} />
    <Route path="/sign-up/*?" component={() => <AuthPage type="sign-up" />} />
    <Route path="/guest/:businessSlug/:tableCode" component={GuestPage} />
    <Route path="/dashboard" component={() => <Protected><DashboardPage /></Protected>} />
    <Route path="/requests" component={() => <Protected><RequestsPage /></Protected>} />
    <Route path="/tables" component={() => <Protected><TablesPage /></Protected>} />
    <Route component={NotFound} />
  </Switch>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'The floor is waiting.' } }, signUp: { start: { title: 'Create your workspace', subtitle: 'Bring a calmer shift to your team.' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <RoutedErrorBoundary><SignOutAwareRoutes /></RoutedErrorBoundary>
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;