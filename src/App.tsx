import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './lib/app';
import { useI18n } from './lib/i18n';
import { scheduleReminder } from './lib/exporters';
import { Shell } from './components/Shell';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import { About, Privacy, Terms } from './pages/Legal';

const Talk = lazy(() => import('./pages/Talk'));
const Insights = lazy(() => import('./pages/Insights'));
const Pratikraman = lazy(() => import('./pages/Pratikraman'));
const Profile = lazy(() => import('./pages/Profile'));
const Wisdom = lazy(() => import('./pages/Wisdom'));
const Goals = lazy(() => import('./pages/Goals'));
const Awards = lazy(() => import('./pages/Awards'));
const Journal = lazy(() => import('./pages/Journal'));

function Loading() {
  const { t } = useI18n();
  return <Spinner label={t('common.loading')} />;
}

function Protected({ children }: { children: ReactNode }) {
  const { ready, user, profile } = useApp();
  if (!ready || (user && !profile)) return <div className="mx-auto max-w-md p-6"><Loading /></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (profile && !profile.onboarding_done) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingGate() {
  const { ready, user, profile } = useApp();
  if (!ready || (user && !profile)) return <div className="mx-auto max-w-md p-6"><Loading /></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (profile?.onboarding_done) return <Navigate to="/" replace />;
  return <Onboarding />;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { ready, user } = useApp();
  if (ready && user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Reminder() {
  const { profile } = useApp();
  const { t } = useI18n();
  const time = profile?.reminder_time ?? null;
  useEffect(() => scheduleReminder(time, t('app.name'), t('profile.reminder_text')), [time, t]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Reminder />
        <Suspense fallback={<div className="mx-auto max-w-md p-6"><Loading /></div>}>
          <Routes>
            <Route path="/welcome" element={<PublicOnly><Landing /></PublicOnly>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/onboarding" element={<OnboardingGate />} />
            <Route element={<Protected><Shell /></Protected>}>
              <Route index element={<Home />} />
              <Route path="talk" element={<Talk />} />
              <Route path="insights" element={<Insights />} />
              <Route path="pratikraman" element={<Pratikraman />} />
              <Route path="profile" element={<Profile />} />
              <Route path="wisdom" element={<Wisdom />} />
              <Route path="wisdom/:tradition" element={<Wisdom />} />
              <Route path="goals" element={<Goals />} />
              <Route path="awards" element={<Awards />} />
              <Route path="journal" element={<Journal />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
