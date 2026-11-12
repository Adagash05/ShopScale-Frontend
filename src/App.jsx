import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { MODE, crossTarget } from './config/env.js'
import { safeNext } from './config/domains.js'
import { useAuth } from './auth/AuthContext.jsx'
import Layout from './pages/Layout.jsx'
import MarketingLayout from './marketing/MarketingLayout.jsx'
import { Skeleton } from './components.jsx'
import { moduleRoutes } from './modules/registry.js'

const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const AccountLinks = { Forgot: lazy(() => import('./pages/AccountLinks.jsx').then((m) => ({ default: m.ForgotPassword }))), Reset: lazy(() => import('./pages/AccountLinks.jsx').then((m) => ({ default: m.ResetPassword }))), Verify: lazy(() => import('./pages/AccountLinks.jsx').then((m) => ({ default: m.VerifyEmail }))) }
const AcceptInvite = lazy(() => import('./pages/AcceptInvite.jsx'))
const Pricing = lazy(() => import('./pages/Pricing.jsx'))
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const Sell = lazy(() => import('./pages/Sell.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const ProductForm = lazy(() => import('./pages/ProductForm.jsx'))
const Customers = lazy(() => import('./pages/Customers.jsx'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail.jsx'))
const Expenses = lazy(() => import('./pages/Expenses.jsx'))
const More = lazy(() => import('./pages/More.jsx'))
const SalesHistory = lazy(() => import('./pages/SalesHistory.jsx'))
const Stock = lazy(() => import('./pages/Stock.jsx'))
const Plan = lazy(() => import('./pages/Plan.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Team = lazy(() => import('./pages/Team.jsx'))
const Help = lazy(() => import('./pages/Help.jsx'))
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'))
const SupplierDetail = lazy(() => import('./pages/SupplierDetail.jsx'))
const StoreApp = lazy(() => import('./store/index.jsx'))
const NewPurchase = lazy(() => import('./pages/NewPurchase.jsx'))
const M = {
  Home: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.HomePage }))),
  Features: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.FeaturesPage }))),
  Retail: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.RetailPage }))),
  Restaurant: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.RestaurantPage }))),
  Catering: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.CateringPage }))),
  About: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.AboutPage }))),
  Contact: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.ContactPage }))),
  Faq: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.FaqPage }))),
  Privacy: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.PrivacyPage }))),
  Terms: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.TermsPage }))),
  Refunds: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.RefundPage }))),
  NotFound: lazy(() => import('./marketing/Pages.jsx').then((m) => ({ default: m.NotFoundPage }))),
}

function Splash() {
  return <div style={{ padding: 24, display: 'grid', gap: 12 }}><Skeleton height={28} width="40%" /><Skeleton height={120} /></div>
}

/** Full-page hand-off to the other deployment (root domain <-> app domain). The path, query and hash are kept. */
function Redirect({ url }) {
  useEffect(() => { window.location.replace(url) }, [url])
  return <Splash />
}

/** Where to send a signed-in person after login: the page they were trying to reach, else their dashboard. */
function destination(location, business) {
  const wanted = safeNext(location.state?.from) || safeNext(new URLSearchParams(location.search).get('next'))
  return wanted || (business ? '/dashboard' : '/onboarding')
}

function Guard({ children, needBusiness = true }) {
  const { user, business, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  if (needBusiness && !business) return <Navigate to="/onboarding" replace />
  if (!needBusiness && business) return <Navigate to="/dashboard" replace />
  return children
}

/** Login and registration: a signed-in person is sent on to where they were going. */
function Public({ children }) {
  const { user, business, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (user) return <Navigate to={destination(location, business)} replace />
  return children
}

/** "/" on the application domain: never the marketing page. */
function AppEntry() {
  const { user, business, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={business ? '/dashboard' : '/onboarding'} replace />
}

function AppNotFound() {
  return <div className="err-page"><div className="stack" style={{ justifyItems: 'center' }}><h1 style={{ fontSize: '3rem' }}>404</h1><p className="muted">We could not find that page.</p><div className="row"><a href="/" className="btn primary">Go to your dashboard</a></div></div></div>
}

/** Anything this host does not serve: hand it to the host that does, otherwise show this host's own 404. */
function Fallback() {
  const { pathname, search, hash } = useLocation()
  const url = crossTarget(pathname + search + hash)
  if (url) return <Redirect url={url} />
  return MODE === 'app' ? <AppNotFound /> : <MarketingLayout><M.NotFound /></MarketingLayout>
}

const marketingRoutes = (
  <Route element={<MarketingLayout />}>
    <Route path="features" element={<M.Features />} />
    <Route path="retail" element={<M.Retail />} />
    <Route path="restaurant" element={<M.Restaurant />} />
    <Route path="catering" element={<M.Catering />} />
    <Route path="pricing" element={<Pricing />} />
    <Route path="about" element={<M.About />} />
    <Route path="contact" element={<M.Contact />} />
    <Route path="faq" element={<M.Faq />} />
    <Route path="privacy" element={<M.Privacy />} />
    <Route path="terms" element={<M.Terms />} />
    <Route path="refunds" element={<M.Refunds />} />
  </Route>
)

const storefrontRoutes = (
  <>
    <Route path="/s/:slug/*" element={<StoreApp />} />
  </>
)

const appRoutes = (
  <>
    <Route path="/login" element={<Public><Login /></Public>} />
    <Route path="/register" element={<Public><Register /></Public>} />
    <Route path="/forgot-password" element={<AccountLinks.Forgot />} />
    <Route path="/reset-password" element={<AccountLinks.Reset />} />
    <Route path="/verify-email" element={<AccountLinks.Verify />} />
    <Route path="/accept-invite" element={<AcceptInvite />} />
    <Route path="/onboarding" element={<Guard needBusiness={false}><Onboarding /></Guard>} />
    <Route element={<Guard><Layout /></Guard>}>
      <Route path="dashboard" element={<Home />} />
      <Route path="sell" element={<Sell />} />
      <Route path="products" element={<Products />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id" element={<ProductForm />} />
      <Route path="customers" element={<Customers />} />
      <Route path="customers/:id" element={<CustomerDetail />} />
      <Route path="expenses" element={<Expenses />} />
      <Route path="suppliers" element={<Suppliers />} />
      <Route path="suppliers/:id" element={<SupplierDetail />} />
      <Route path="purchases/new" element={<NewPurchase />} />
      <Route path="more" element={<More />} />
      <Route path="more/sales" element={<SalesHistory />} />
      <Route path="more/stock" element={<Stock />} />
      <Route path="more/team" element={<Team />} />
      <Route path="more/plan" element={<Plan />} />
      <Route path="more/settings" element={<Settings />} />
      <Route path="more/help" element={<Help />} />
      {moduleRoutes.map(({ path, Component }) => <Route key={path} path={path} element={<Component />} />)}
    </Route>
  </>
)

const homeRoute = <Route path="/" element={MODE === 'app' ? <AppEntry /> : <MarketingLayout><M.Home /></MarketingLayout>} />

/**
 * Routes are chosen by hostname (see src/config/domains.js and DOMAIN_CONFIGURATION.md):
 *  - public  (shopscale.com.ng, www): marketing pages and /s/ storefronts only
 *  - app     (app.shopscale.com.ng): login, register, onboarding and the whole business app
 *  - unified (localhost, preview deploys, single-origin installs): everything, as before
 * Marketing pages never redirect a signed-in visitor to the dashboard.
 */
export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        {homeRoute}
        {MODE !== 'app' && marketingRoutes}
        {MODE !== 'app' && storefrontRoutes}
        {MODE !== 'public' && appRoutes}
        <Route path="*" element={<Fallback />} />
      </Routes>
    </Suspense>
  )
}
