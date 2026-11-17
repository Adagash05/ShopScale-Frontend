import { article, h, list, p, steps, tip, warn, shot, illus } from './b.js'

export default {
  id: 'storefront', title: 'Online Storefront', icon: 'store',
  desc: 'Open your online store, add products, take payments with Paystack and share your link.',
  articles: [
    article('overview', 'Understanding the ShopScale online storefront', 'A web store, built from your products, where customers browse, order and pay.', [
      p('Your storefront is a public web page for your business. It is built automatically from the products you already have in ShopScale, so you do not enter anything twice.'),
      illus('store-journey'),
      h('How it fits together'),
      list('You keep products and stock in ShopScale. The store shows your active products.', 'Customers add items to a cart and check out with their name, phone and delivery choice.', 'They pay online through **your own Paystack account**, or choose to pay when they pick up or receive the order if you allow it.', 'You get a notification, see the order under **More, Online orders** and process it.', 'When you complete the order, ShopScale records the sale and reduces your stock.'),
      h('What you need'),
      list('A plan that includes the online store (Essential or above).', 'At least one product with stock.', 'To take card or transfer payments online: a Paystack account of your own. See [Connecting Paystack](/help/storefront/paystack).'),
      warn('Your money goes straight to your own Paystack account. ShopScale never holds it.'),
    ], { related: ['storefront/activate-store', 'orders/understand-orders'], keywords: 'online store website shop' }),

    article('activate-store', 'Activating your online store', 'Open your store to customers in a few taps.', [
      p('Your store exists from the day you set up, but customers only see it after you open it.'),
      steps('Open **More** and choose **Online store**.', 'If you see "The online store is not included in your current plan", choose **See plans** and upgrade to Essential or above.', 'Turn on **Open my store to customers**. Your store link is shown under it.', 'Fill in your store details (see [Customising your store](/help/storefront/customise-store)).', 'Choose how customers get their orders (see [Delivery and pickup](/help/storefront/delivery)).', 'Tap **Save store settings**.'),
      shot('store-settings', 'The Online store screen with "Open my store to customers" switched on.'),
      h('What happens next'),
      p('The heading changes from "Closed" to "Open for orders", and anyone with your link can browse. Add products next: [Adding and publishing products](/help/storefront/add-products).'),
      h('Closing the store'),
      p('Turn **Open my store to customers** off and save. Customers see "This store is not open right now".'),
      warn('Turn on a way to pay (Paystack or pay-on-pickup) before you share the link, or customers will not be able to place orders.'),
    ], { related: ['storefront/store-url', 'storefront/paystack'], keywords: 'open enable turn on' }),

    article('store-url', 'Understanding your store URL', 'Your store lives at a link that includes your business address.', [
      p('Your link is shown under **Open my store to customers** on the Online store screen. It follows the pattern `…/s/your-business`, where the last part is the store address you chose when you set up.'),
      list('The address is checked for uniqueness when you choose it.', 'The same link shows each product and order page, so it is safe to share.', 'Businesses on the Business plan can also use their own domain: see [Using your own domain](/help/storefront/custom-domain).'),
      tip('Add your link to your WhatsApp status, Instagram bio and printed receipts.'),
    ], { related: ['storefront/share-store'] }),

    article('customise-store', 'Customising store information', 'Set your store name, description, phone and WhatsApp.', [
      p('This is what customers read first. Keep it short and clear.'),
      steps('Open **More, Online store**.', 'Edit **Store name** and **Short description** (up to 500 characters).', 'Add your **Phone** and **WhatsApp** so customers can reach you.', 'Tap **Save store settings**.'),
      p('Only people with the store-edit permission can change these. Everyone else sees them read-only.'),
      h('What customers see'),
      p('Your name and description appear on your store home page. Your phone and WhatsApp appear for questions, with a **Chat on WhatsApp** button when WhatsApp is set.'),
    ], { related: ['storefront/branding', 'storefront/update-store'] }),

    article('branding', 'Adding your logo and branding', 'Upload your logo and add links and opening hours.', [
      p('On the Online store screen, find **Logo, links and opening hours**. They show in your store header, footer and contact page. Anything you leave empty is not shown.'),
      steps('Open **More, Online store** and scroll to **Logo, links and opening hours**.', 'Upload your logo (it is shrunk on your phone first).', 'Add your **Instagram**, **Facebook**, **X (Twitter)** or **TikTok** link if you want them shown.', 'Write your **Opening hours**, one line per day or range, for example "Mon-Sat 8am-7pm".', 'Save. "Store profile saved" appears.'),
      warn('The look of every ShopScale store is controlled by ShopScale so all stores load quickly and work on every phone. You add your logo, name and details; you do not choose colours or fonts.'),
    ], { related: ['storefront/customise-store'] }),

    article('add-products', 'Adding and publishing products', 'Products you add to ShopScale appear in your store automatically.', [
      p('There is no separate publish button for the store. A product appears when it is **active**, it is something you sell (goods or a finished product), and the store is open.'),
      steps('Add the product in **Products** (see [Creating products](/help/products/create-product)).', 'Make sure it has a price and some stock.', 'Open the product and add a **Photo** (see [Product images](/help/products/product-images)).', 'Choose a **Category** so customers can shop by category.', 'Open your store link and check it is there.'),
      h('What controls visibility'),
      list('**Archived** products are hidden. Restore them to show them again.', 'A product with **no stock** still shows, marked **Sold out**.', 'Ingredients and menu items made to order are not shown as store products.', 'If your store is closed, nothing shows.'),
      tip('If a product is missing, see [Storefront is not showing products](/help/troubleshooting/storefront-not-showing).'),
    ], { related: ['storefront/manage-products', 'products/product-images'], keywords: 'publish list products online' }),

    article('manage-products', 'Descriptions, images and prices', 'Keep product pages accurate: edit them in Products.', [
      p('Everything customers see on a product comes from the product in ShopScale. Change it there and the store updates.'),
      list('**Description**: open the product, tap **Add more details (optional)** and write the **Description**.', '**Photo**: see [Product images](/help/products/product-images).', '**Price**: edit **Selling price (₦)**. The store always uses your current price.', '**Options**: sizes and colours each have their own price and stock.'),
      warn('Totals are always worked out by the server from your prices. A customer cannot change a price, and you confirm the final price when you receive the order.'),
    ], { related: ['storefront/availability', 'products/variants-units'] }),

    article('availability', 'Managing product availability', 'Availability follows your stock. Archive a product to hide it.', [
      list('When stock reaches zero the product shows as **Sold out**.', 'When you add stock, it becomes available again straight away.', 'Customers can use the **Available only** filter to hide sold-out items.', 'To remove a product from the store entirely, archive it.'),
      p('If you turned on selling at zero in Settings, products with zero stock stay available. Only do this if you really can supply them.'),
      p('When a customer orders more than you have, they see a message such as "Only 3 of Ankara shirt left", so you do not oversell.'),
    ], { related: ['products/low-stock', 'products/edit-product'] }),

    article('organise-products', 'Organising products into categories', 'Categories become "Shop by category" in your store.', [
      p('Customers can browse your store by category. Give each product a category in **Products** (see [Product categories](/help/products/categories)).'),
      steps('Open **Products** and tap the product.', 'Tap **Add more details (optional)** and choose a **Category**, or type a **New category name**.', 'Save the product.'),
      list('Products without a category still appear; they just are not in a category group.', 'Keep names short, for example "Dresses", "Shoes", "Accessories".'),
      h('What if a product is not where I expect?'),
      p('Open the product and check its category. If the product is not in your store at all, see [Why a product is not showing](/help/storefront/troubleshoot-visibility).'),
    ], { related: ['products/categories'] }),

    article('customer-view', 'How customers see your store', 'Browse, search, add to cart, check out.', [
      p('This is what your customer does, so you can help them if they get stuck.'),
      steps('They open your store link and see your name, description and categories.', 'They browse, **Search** products, filter by **Available only** or sort.', 'They tap a product to see photos, price and options, then **Add to cart**.', 'In the cart they review items and tap **Checkout**.', 'They enter name, phone (and email to pay online), choose pickup or delivery, and choose how to pay.', 'They see an order page that shows whether their order was received and whether payment was confirmed.'),
      p('Customers can see their recent orders on their own device under **My orders**. If they ordered on another device they use the link they were given after ordering.'),
      p('After you complete an order, the customer can leave a review of an item. You approve each review before it shows in your store.'),
    ], { related: ['storefront/checkout', 'storefront/preview'] }),

    article('preview', 'Previewing your storefront', 'Open your own link to see exactly what customers see.', [
      steps('Open **More, Online store** and copy or tap your store link.', 'Open it in a new tab, or on your phone.', 'Look at your name, logo, products, prices and photos. Try the search and a category.', 'Add something to the cart and go as far as checkout to check the delivery and payment choices.'),
      tip('If your store is closed you will see "This store is not open right now". Turn on **Open my store to customers** first.'),
      warn('Do not complete a real payment just to test. Check the screens up to the payment step, or use Paystack test keys: see [Connecting Paystack](/help/storefront/paystack).'),
    ], { related: ['storefront/share-store'] }),

    article('share-store', 'Sharing your store and products', 'Send customers your link on WhatsApp, Instagram and receipts.', [
      p('Your store link is on the Online store screen. Copy it and share it anywhere.'),
      list('Post it in your WhatsApp status and groups.', 'Put it in your Instagram and TikTok bio.', 'Print it on shop signs, bags and receipts.', 'Share a single product by opening it in the store and copying that page\'s link.'),
      tip('Customers who join your list from the store footer appear under **More, Store inbox**, where you can copy all their emails.'),
    ], { related: ['storefront/store-url', 'storefront/customer-view'] }),

    article('receiving-orders', 'Receiving orders from online customers', 'You are notified, and the order appears under Online orders.', [
      p('When a customer places an order, ShopScale sends a notification: **New online order #12**, with the customer\'s name, the total and whether it was paid online or is pay later.'),
      steps('Tap the notification, or open **More, Online orders**.', 'Open the order to see the customer, items, delivery or pickup, and payment.', 'Process it: [Processing online orders](/help/orders/process-orders).'),
      warn('An order that is waiting for payment does not notify you yet. You are notified when payment is confirmed, so you never prepare an order that has not been paid.'),
    ], { related: ['orders/understand-orders', 'orders/process-orders'] }),

    article('checkout', 'Understanding customer checkout', 'What your customer enters and what ShopScale checks.', [
      h('What the customer fills in'),
      list('**Full name** and **Phone number** are required.', '**Email** is required to pay online (for the receipt); it is optional otherwise.', '**Pickup** or **Delivery**. Delivery needs a **Delivery address**.', 'An optional **Note for the business**.', 'How to pay: **Pay now** (card or bank transfer, securely through Paystack) or pay later if you allowed it.'),
      h('What ShopScale checks'),
      list('Prices and the delivery fee are worked out on the server, never taken from the customer\'s phone.', 'Every item must still be available and in stock.', 'An order total must be above zero.'),
      p('Customers see "The business confirms the final price and availability when it receives your order."'),
    ], { related: ['storefront/online-payments', 'orders/payment-status'] }),

    article('online-payments', 'Understanding online payments', 'Pay now, or pay on pickup or delivery.', [
      p('Customers can pay in two ways, depending on what you switched on.'),
      list('**Pay now**: the customer pays by card or bank transfer on Paystack. The order becomes "paid online" only after Paystack confirms the money.', '**Pay on pickup or delivery**: the order is created straight away as New, marked **Pay on handover**. You record how they paid when you complete the order.'),
      warn('An order being created does not mean it is paid. Online orders stay **waiting for payment** until Paystack confirms.'),
      p('If payment is not confirmed the order does not reach your New list. See [Handling failed payments](/help/orders/failed-payments).'),
    ], { related: ['storefront/paystack', 'orders/payment-status'] }),

    article('payment-settings', 'Configuring payment settings', 'Choose what customers can pay with.', [
      steps('Open **More, Online store**.', 'To allow pay-later orders, turn on **Customers can pay on pickup or delivery**.', 'To take online payments, connect Paystack (next article).', 'Tap **Save store settings**.'),
      p('If neither is available, customers cannot place orders. Pay-now is only offered after your Paystack keys are connected.'),
      h('What happens after'),
      p('Customers see the payment choices you have turned on when they check out. An online payment creates an order that waits as **Pending payment** until Paystack confirms it. A pay-on-pickup or delivery order arrives as **New** and you collect the money when you hand it over.'),
      h('What if customers cannot pay?'),
      p('Check that at least one option is on and saved. If online payment is missing, your Paystack keys are probably not connected yet. See [Connecting Paystack](/help/storefront/paystack) and [Payments are not working](/help/storefront/troubleshoot-payments).'),
    ], { related: ['storefront/paystack'] }),

    article('paystack', 'Connecting Paystack', 'Take card and bank-transfer payments straight into your own Paystack account.', [
      p('Paystack is the payment company that processes card and bank-transfer payments in Nigeria. Customers pay **you**, through **your own** Paystack account.'),
      h('Before you start'),
      list('Create or sign in to your own Paystack account.', 'You need your **Public key** (starts `pk_`) and **Secret key** (starts `sk_`) from Paystack, under Settings, API Keys and Webhooks.'),
      h('Steps'),
      steps('Open **More, Online store** and scroll to **Online payments (your Paystack account)**.', 'Paste the **Public key** and **Secret key**.', 'Tap **Connect Paystack**. ShopScale checks the keys ("Checking keys…").', 'When it works you see **Connected** with **Test keys** or **Live keys**.', 'Copy the **Webhook URL** shown on that screen. In your Paystack dashboard open **Settings, API Keys and Webhooks** and set the Webhook URL to it.'),
      warn('Your secret key is stored encrypted and is never shown again. Never share it with anyone. Only people with the payments permission (normally the owner) can connect or disconnect Paystack.'),
      tip('Use test keys first. Test payments do not move real money. Switch to live keys when you are ready.'),
      h('Disconnecting'),
      p('**Disconnect Paystack** stops customers paying online. Pay-later orders still work if you allow them.'),
      h('If something goes wrong'),
      list('"This server is missing its encryption key": contact ShopScale Support.', 'Keys rejected: copy them again from Paystack, with no spaces, and make sure public and secret keys belong together.'),
    ], { related: ['storefront/online-payments', 'troubleshooting/payment-pending'], keywords: 'paystack keys webhook' }),

    article('customers', 'Managing online customers', 'Customers who order appear in your orders; reviews and enquiries are in the Store inbox.', [
      list('Each order lists the customer\'s name, phone (tap to call) and email.', '**More, Store inbox** shows **Reviews**, **Enquiries** and **Subscribers**.', 'Approve a review to show it in your store, or hide it.', 'Catering stores show an enquiry form; mark each enquiry as contacted.', 'Use **Copy all emails** to export your subscribers.'),
      p('Online customers are not added to your Customers list automatically. The sale is recorded, with the order number and customer name in its note, when you complete the order.'),
    ], { related: ['orders/understand-orders'] }),

    article('delivery', 'Delivery and pickup settings', 'Offer pickup, delivery, or both, and set your delivery fee.', [
      steps('Open **More, Online store**.', 'Turn on **Customers can pick up** and/or **I deliver**.', 'If you deliver, set the **Delivery fee (₦)** and an optional **Delivery note**.', 'Save.'),
      p('The delivery fee is added at checkout when the customer chooses delivery, and appears on the order. A customer who chooses delivery must give an address.'),
      tip('Use the delivery note to say where you deliver or how long it takes.'),
    ], { related: ['orders/fulfilment'] }),

    article('update-store', 'Updating storefront information', 'Change details whenever you like; the store updates straight away.', [
      list('Store name, description, phone and WhatsApp: **More, Online store**, then **Save store settings**.', 'Logo, links and hours: **Logo, links and opening hours**.', 'Products, prices and photos: edit them in **Products**.', 'Delivery and payment choices: **More, Online store**.'),
      p('Only people with the right permission can change store settings. If your screen is read-only, ask the owner.'),
    ], { related: ['storefront/customise-store'] }),

    article('custom-domain', 'Using your own domain', 'Business plan: show your store on a web address you own.', [
      p('A custom domain such as `shop.yourbusiness.com` can point to your store. It is available on the Business plan.'),
      steps('Open **More, Online store** and find **Custom domain**.', 'Type your domain and tap **Save domain**.', 'At your domain provider add the two records shown: a **CNAME** and a **TXT** record.', 'Tap **Check verification**. When the status says verified, the domain works.'),
      warn('DNS changes can take time to take effect. If the check fails, wait and try again.'),
      p('Not on the Business plan? The screen says "Custom domains are included in the Business plan" with a link to the plans.'),
    ], { related: ['settings/plans'] }),

    article('troubleshoot-visibility', 'Troubleshooting storefront visibility', 'Why customers cannot see your store or a product.', [
      list('"This store is not open right now": turn on **Open my store to customers** and save.', '"The online store is not included in your current plan": upgrade to Essential or above.', 'A product is missing: it may be archived, have no stock, or be an ingredient or made-to-order menu item.', 'Your photo is not showing: open the product and upload it again.', 'The store link does not work: check there are no spaces or missing characters in the address.'),
      p('See also [Storefront is not showing products](/help/troubleshooting/storefront-not-showing).'),
    ], { related: ['troubleshooting/storefront-not-showing', 'storefront/activate-store'] }),

    article('troubleshoot-payments', 'Troubleshooting payment and checkout issues', 'Fixes for customers who cannot pay or finish checkout.', [
      list('"Online payment is not available for this store": connect Paystack first.', '"Pay on pickup or delivery is not available": turn on **Customers can pay on pickup or delivery**.', 'The customer sees "Enter your email to pay online": paying online needs an email address.', '"An item in your cart is no longer available" or "Only N left": the item sold out; remove it or reduce the quantity.', 'Paid but still waiting: see [Online payment is pending](/help/troubleshooting/payment-pending).'),
      h('Keys and the webhook'),
      p('Test keys and live keys are separate. If a customer paid with one mode and your store is connected with the other, the payment will not be found. Also check the **Webhook URL** from the Online store screen is set in your Paystack dashboard.'),
    ], { related: ['troubleshooting/customer-checkout', 'orders/failed-payments'] }),
  ],
}
