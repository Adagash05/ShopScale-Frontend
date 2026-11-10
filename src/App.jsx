import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
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
const Storefront = lazy(() => import('./pages/store/Storefront.jsx'))
const OrderStatus = lazy(() => import('./pages/store/Storefront.jsx').then((m) => ({ default: m.OrderStatus })))
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

function Guard({ children, needBusiness = true }) {
  const { user, business, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  if (needBusiness && !business) return <Navigate to="/onboarding" replace />
  if (!needBusiness && business) return <Navigate to="/dashboard" replace />
  return children
}

function Public({ children }) {
  const { user, business, loading } = useAuth()
  if (loading) return <Splash />
  if (user) return <Navigate to={business ? '/dashboard' : '/onboarding'} replace />
  return children
}

/** The public website at "/" for visitors; signed-in merchants go straight to their dashboard. */
function RootEntry() {
  const { user, business, loading } = useAuth()
  if (loading) return <Splash />
  if (user) return <Navigate to={business ? '/dashboard' : '/onboarding'} replace />
  return <MarketingLayout><M.Home /></MarketingLayout>
}

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={<RootEntry />} />
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
        <Route path="/s/:slug" element={<Storefront />} />
        <Route path="/s/:slug/order/:token" element={<OrderStatus />} />
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
        <Route path="*" element={<MarketingLayout><M.NotFound /></MarketingLayout>} />
      </Routes>
    </Suspense>
  )
}
