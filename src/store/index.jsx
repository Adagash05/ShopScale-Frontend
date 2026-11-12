import { Route, Routes } from 'react-router-dom'
import { StoreProvider } from './StoreContext.jsx'
import StoreLayout from './StoreLayout.jsx'
import StoreHome from './StoreHome.jsx'
import StoreShop from './StoreShop.jsx'
import StoreProduct from './StoreProduct.jsx'
import StoreCart from './StoreCart.jsx'
import StoreCheckout from './StoreCheckout.jsx'
import { MyOrders, OrderStatus } from './StoreOrders.jsx'
import { Enquiry } from './Engage.jsx'
import { About, Contact, Faq, NotFound, Privacy, Returns, Shipping, Terms } from './StorePages.jsx'

/** The whole customer-facing storefront, mounted at /s/:slug/* . One shared design system; the content is the merchant's own. */
export default function StoreApp() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<StoreHome />} />
          <Route path="shop" element={<StoreShop />} />
          <Route path="product/:productId" element={<StoreProduct />} />
          <Route path="cart" element={<StoreCart />} />
          <Route path="checkout" element={<StoreCheckout />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="order/:token" element={<OrderStatus />} />
          <Route path="enquiry" element={<Enquiry />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="returns" element={<Returns />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}
