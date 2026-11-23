/**
 * Single source of truth for Help Centre screenshots. Pure data, read by the Help Centre (data.js) and by the capture, verify and
 * report scripts in scripts/.
 *
 * SHOTS   one entry per picture:
 *   id         file: public/help/shots/<id>.png
 *   account    demo business to sign in as (scripts/demo/demo-config.mjs); omit for public pages
 *   viewport   'desktop' (default, 960x720: sidebar + content) or 'mobile' (420x860: what a customer sees on a phone)
 *   steps      what the capture script does in the REAL app first: { goto } { waitText } { click } { clickCss } { fill, value } { scroll } { wait }
 *              ({slug} in a path = the demo store's slug)
 *   highlight  what to outline on the picture: { text } or { css }. The capture script measures it on the real page and saves
 *              <id>.json next to the image, and the Help Centre draws the outline over the image (the picture itself is never edited)
 *   caption    default caption
 *   placements legacy single figures for articles that have no numbered steps: [articlePath, caption?, after?]
 *
 * VISUAL  articlePath -> list of { step, shot, title, callout?, caption?, block? }
 *   Pairs a numbered instruction in an EXISTING article (1-based `step` in its first steps list, or `block: n` for the n-th list)
 *   with the picture of that exact screen. The article text is not rewritten; data.js renders each paired step as a step card.
 *
 * A picture is shown only if its file exists. In development a missing one shows a clear marker; in production it is simply not
 * rendered. scripts/help-visual-report.mjs lists every missing picture.
 */
const A = 'retail'
const S = (id, account, steps, caption, extra = {}) => ({ id, account, steps, caption, ...extra })
const go = (path, ...more) => [{ goto: path }, ...more, { wait: 700 }]

export const SHOTS = [
  // ---- A. Getting started (public pages and a brand-new account)
  S('site-home', undefined, go('/', { waitText: 'Start free trial' }), 'The ShopScale website. Choose Start free trial to begin.', { highlight: { text: 'Start free trial' } }),
  S('register-form', undefined, go('/register', { waitText: 'Create account' }, { fill: '#fullName', value: 'Aminu Bello' }, { fill: '#email', value: 'aminu@example.com' }, { fill: '#phone', value: '08000000001' }, { fill: '#password', value: 'Sample#Pass123' }),
    'The sign-up form, filled in with sample details.', { highlight: { css: 'form' } }),
  S('register-submit', undefined, go('/register', { waitText: 'Create account' }, { fill: '#fullName', value: 'Aminu Bello' }, { fill: '#email', value: 'aminu@example.com' }, { fill: '#password', value: 'Sample#Pass123' }),
    'Tap Create account to finish.', { highlight: { text: 'Create account' } }),
  S('onboarding-type', 'newuser', go('/onboarding', { waitText: 'Continue' }), 'Step one of setup: choose what you sell, then tap Continue.', { highlight: { text: 'Continue' } }),
  S('onboarding-details', 'newuser', go('/onboarding', { waitText: 'Continue' }, { click: 'Continue' }, { fill: '#bname', value: 'Aminu Stores' }, { fill: '#bphone', value: '08000000001' }),
    'Step two: your business name and phone number.', { highlight: { css: '#bname' } }),
  S('onboarding-address', 'newuser', go('/onboarding', { waitText: 'Continue' }, { click: 'Continue' }, { fill: '#bname', value: 'Aminu Stores' }, { click: 'Continue' }, { wait: 1500 }),
    'Step three: your store address. ShopScale checks that it is free as you type.', { highlight: { css: '#slug' } }),
  S('dashboard', A, go('/dashboard', { wait: 800 }), 'The dashboard of the sample business Aminu Stores, the first screen after you sign in.', { placements: [['getting-started/dashboard']] }),
  S('nav-sidebar', A, go('/dashboard', { wait: 800 }), 'The main menu on the left (on a phone it is the bar along the bottom).', { highlight: { css: 'aside.side' }, placements: [['getting-started/navigation']] }),
  S('more-menu', A, go('/more'), 'The More screen lists the other tools available to your business.', { placements: [['getting-started/navigation']] }),
  S('business-settings', A, go('/more/settings'), 'Settings, where your business name and contact details are kept.', { placements: [['getting-started/business-information'], ['settings/business-details']] }),
  S('plan', A, go('/more/plan'), 'The Plan screen shows your current plan and what it includes.', { placements: [['settings/plans']] }),

  // ---- B. Products and inventory
  S('products-list', A, go('/products', { waitText: 'Mama Gold Rice 50kg' }), 'The Products list with sample products, their prices and stock.', { placements: [['products/understand-inventory', undefined, 'start']] }),
  S('products-add', A, go('/products', { waitText: 'Add product' }), 'Open Products and tap Add product.', { highlight: { text: 'Add product' } }),
  S('product-form-name', A, go('/products/new', { fill: '#pname', value: 'Maggi Star Cubes (Pack of 50)' }, { fill: '#pprice', value: '1800' }, { fill: '#pqty', value: '40' }), 'The Add product form. Start with the product name.', { highlight: { css: '#pname' } }),
  S('product-form-price', A, go('/products/new', { fill: '#pname', value: 'Maggi Star Cubes (Pack of 50)' }, { fill: '#pprice', value: '1800' }, { fill: '#pqty', value: '40' }), 'Enter the selling price and how many you have in stock.', { highlight: { css: '#pprice' } }),
  S('product-form-more', A, go('/products/new', { fill: '#pname', value: 'Maggi Star Cubes (Pack of 50)' }, { fill: '#pprice', value: '1800' }, { fill: '#pqty', value: '40' }, { click: 'Add more details' }, { wait: 500 }), 'Add more details shows cost price, low-stock warning, barcode, category and description.', { highlight: { text: 'Hide extra details' } }),
  S('product-saved', A, go('/products/new', { fill: '#pname', value: 'Maggi Star Cubes (Pack of 50)' }, { fill: '#pprice', value: '1800' }, { fill: '#pqty', value: '40' }, { click: 'Save product' }, { waitText: 'Maggi Star Cubes' }), 'After saving, the new product appears in your product list.', { highlight: { text: 'Maggi Star Cubes' } }),
  S('products-open-row', A, go('/products', { waitText: 'Mama Gold Rice 50kg' }), 'Tap the product you want to change.', { highlight: { text: 'Mama Gold Rice 50kg' } }),
  S('product-edit', A, go('/products', { click: 'Mama Gold Rice 50kg' }, { wait: 900 }), 'The product opens for editing. Change what you need, then save.', { highlight: { css: '#pprice' } }),
  S('stock', A, go('/more/stock', { wait: 600 }), 'The Stock screen lists what you have and flags items that are running low.', { placements: [['products/manage-stock'], ['products/low-stock']] }),
  S('stock-adjust', A, go('/more/stock', { wait: 600 }, { click: 'Add stock' }, { wait: 600 }), 'Choose what happened (stock received, damaged, or a recount), then enter the quantity.', { highlight: { css: '.modal' } }),

  // ---- E. Sales and POS
  S('sell-open', A, go('/sell', { wait: 700 }), 'The Sell screen. Search for a product or tap one to add it.'),
  S('sell-screen', A, go('/sell', { click: 'Mama Gold Rice 50kg' }, { click: 'Peak Milk Tin 400g' }, { click: 'Sugar 1kg' }), 'Three sample items added to the sale. Tap a product again to add more.', { placements: [['sales/add-products-to-sale']] }),
  S('sell-customer', A, go('/sell', { click: 'Mama Gold Rice 50kg' }, { click: 'Choose customer' }, { wait: 600 }), 'Choose a customer, or add a new one, to link the sale to them.', { highlight: { css: '.modal' } }),
  S('sell-payment', A, go('/sell', { click: 'Mama Gold Rice 50kg' }, { click: 'Peak Milk Tin 400g' }, { scroll: 'Confirm sale' }, { wait: 400 }), 'Choose how the customer is paying, check the total, then tap Confirm sale.', { highlight: { text: 'Confirm sale' } }),
  S('sell-receipt', A, go('/sell', { click: 'Sugar 1kg' }, { scroll: 'Confirm sale' }, { click: 'Confirm sale' }, { waitText: 'New sale' }, { wait: 500 }), 'The receipt appears. Tap Print, or New sale to start the next one.', { highlight: { text: 'New sale' } }),
  S('sales-history', A, go('/more/sales', { wait: 600 }), 'Sales history lists the sales you have recorded.', { placements: [['sales/sales-history']] }),
  S('sales-report', A, go('/more/sales-report', { wait: 800 }), 'The sales report for a chosen period.', { placements: [['sales/reports'], ['finance/financial-reports']] }),
  S('customers', A, go('/customers', { waitText: 'Alhaji Musa Lawal' }), 'The Customers list with sample customers.', { placements: [['sales/customers']] }),
  S('customer-detail', A, go('/customers', { click: 'Alhaji Musa Lawal' }, { wait: 800 }), 'A customer record showing what they owe and their recent sales.', { placements: [['finance/debtors']] }),

  // ---- F. Purchasing and suppliers
  S('suppliers', A, go('/suppliers', { waitText: 'Lagos Grains Wholesale Ltd' }), 'The Suppliers tab with sample suppliers. Tap Add supplier to add one.', { highlight: { text: 'Add supplier' } }),
  S('supplier-form', A, go('/suppliers', { waitText: 'Add supplier' }, { click: 'Add supplier' }, { wait: 600 }), 'Enter the supplier name and, if you like, phone, email, address and notes.', { highlight: { css: '.modal' } }),
  S('purchases-hub', A, go('/more/orders', { wait: 600 }), 'Suppliers and purchases. Tap Receive stock when goods arrive.', { highlight: { text: 'Receive stock' } }),
  S('new-purchase', A, go('/purchases/new', { wait: 800 }), 'Record the products you received, how many, what each cost and how you paid.'),
  S('supplier-detail', A, go('/suppliers', { click: 'Lagos Grains Wholesale Ltd' }, { wait: 800 }), 'A supplier showing what you owe them. Tap Record a payment when you pay.', { highlight: { text: 'Record a payment' } }),

  // ---- K. Finance
  S('expenses', A, go('/expenses', { wait: 700 }), 'The Expenses screen with sample expenses. Tap Add expense to record one.', { highlight: { text: 'Add expense' } }),
  S('expense-form', A, go('/expenses', { click: 'Add expense' }, { wait: 600 }), 'Say what it was for, the amount and how you paid.', { highlight: { css: '.modal' } }),
  S('money', A, go('/more/money', { wait: 900 }), 'The money overview: what came in, what went out and what is owed.', { placements: [['finance/overview']] }),
  S('accounts', A, go('/more/accounts', { wait: 700 }), 'Cash and bank accounts. Tap Add account to add one.', { highlight: { text: 'Add account' } }),

  // ---- I and J. Employees and branches
  S('team', A, go('/more/team', { wait: 700 }), 'The Team screen. Tap Add team member to invite someone.', { highlight: { text: 'Add team member' } }),
  S('team-form', A, go('/more/team', { click: 'Add team member' }, { wait: 600 }), 'Enter their name and email, and choose a role.', { highlight: { css: '.modal' } }),
  S('role-form', A, go('/more/team', { click: 'New role' }, { wait: 600 }), 'Name the role and turn on the permissions it should have.', { highlight: { css: '.modal' } }),
  S('branches', A, go('/more/branches', { wait: 700 }), 'The Locations screen with a main location and a second branch. Tap Add location to add one.', { highlight: { text: 'Add location' } }),
  S('branch-form', A, go('/more/branches', { click: 'Add location' }, { wait: 600 }), 'Enter the location name, and optionally address and phone.', { highlight: { css: '.modal' } }),
  S('transfers', A, go('/more/transfers', { wait: 700 }), 'Stock transfers between locations. Tap Send stock to start one.', { highlight: { text: 'Send stock' } }),
  S('transfer-form', A, go('/more/transfers', { click: 'Send stock' }, { wait: 600 }), 'Choose where the stock is going from and to, then add the products.', { highlight: { css: '.modal' } }),

  // ---- C and D. Online storefront and online orders
  S('nav-online-store', A, go('/more', { waitText: 'Online store' }), 'Open More and choose Online store.', { highlight: { text: 'Online store' } }),
  S('store-settings', A, go('/more/store', { wait: 1000 }), 'The Online store screen with "Open my store to customers" switched on.', { highlight: { text: 'Open my store' }, placements: [['storefront/overview', 'Step 1. You open your online store from the Online store screen.'], ['storefront/store-url'], ['storefront/share-store']] }),
  S('store-settings-save', A, go('/more/store', { wait: 800 }, { scroll: 'Save store settings' }, { wait: 400 }), 'Tap Save store settings when you are done.', { highlight: { text: 'Save store settings' } }),
  S('store-public', undefined, go('/s/{slug}', { waitText: 'Add to cart' }, { wait: 700 }), 'What a customer sees when they open your store link: your products, prices and an Add to cart button.', { viewport: 'mobile', placements: [['storefront/overview', 'Step 2. A customer opens your store link and browses your products.']], highlight: { text: 'Add to cart' } }),
  S('store-cart', undefined, go('/s/{slug}', { waitText: 'Add to cart' }, { click: 'Add to cart' }, { click: 'Add to cart' }, { click: 'View cart' }, { wait: 700 }), 'The customer\'s cart, with their items and quantities.', { viewport: 'mobile', placements: [['storefront/overview', 'Step 3. The customer adds items to their cart.']], highlight: { text: 'Checkout' } }),
  S('store-checkout', undefined, go('/s/{slug}', { waitText: 'Add to cart' }, { click: 'Add to cart' }, { click: 'View cart' }, { fill: '#cn', value: 'Chioma Eze' }, { fill: '#cp', value: '08000030001' }, { click: 'Pay on' }, { wait: 500 }), 'The checkout form: name, phone number, pickup or delivery, and how to pay. (The order has not been placed in this picture.)', { viewport: 'mobile', placements: [['storefront/overview', 'Step 4. The customer fills in the checkout form and places the order.']], highlight: { css: '#cn' } }),
  S('store-order-placed', undefined, go('/s/{slug}', { waitText: 'Add to cart' }, { click: 'Add to cart' }, { click: 'View cart' }, { fill: '#cn', value: 'Chioma Eze' }, { fill: '#cp', value: '08000030001' }, { click: 'Pay on' }, { click: 'Place order' }, { wait: 1800 }), 'After checkout the customer sees their order page. This places one real sample order in the demo store.', { viewport: 'mobile' }),
  S('online-orders', A, go('/more/store-orders', { waitText: 'Online orders' }, { wait: 700 }), 'The Online orders list with sample orders in different statuses.', { placements: [['orders/understand-orders'], ['storefront/overview', 'Step 5. The order arrives in Online orders.']] }),
  S('order-new', A, go('/more/store-orders', { waitText: 'Online orders' }, { click: 'Rita Johnson' }, { wait: 700 }), 'A new order. Check the items, then tap Confirm order.', { highlight: { text: 'Confirm order' } }),
  S('order-confirmed', A, go('/more/store-orders', { waitText: 'Online orders' }, { click: 'Segun Adebayo' }, { wait: 700 }), 'A confirmed order. When it is packed, tap Mark as ready.', { highlight: { text: 'Mark as ready' } }),
  S('order-ready', A, go('/more/store-orders', { waitText: 'Online orders' }, { click: 'Halima Garba' }, { wait: 700 }), 'A ready order. When the customer has it, choose how they paid and complete it.', { highlight: { text: 'Payment received' } }),
  S('online-orders-ready', A, go('/more/store-orders', { waitText: 'Online orders' }, { click: 'Ready' }, { wait: 700 }), 'The Ready tab lists orders that are packed and waiting for the customer.'),
  S('order-detail', A, go('/more/store-orders', { waitText: 'Online orders' }, { click: 'Chioma Eze' }, { wait: 700 }), 'An order open with its customer, items and payment.', { placements: [['storefront/overview', 'Step 6. You open the order, confirm it, mark it ready, and complete it when the customer has it.'], ['orders/order-details']] }),

  // ---- G. Restaurant, kitchen and bakery
  S('menu-items', 'restaurant', go('/more/menu', { wait: 900 }), 'The Menu screen with sample dishes and prices. Tap Add menu item to add one.', { highlight: { text: 'Add menu item' } }),
  S('menu-item-form', 'restaurant', go('/more/menu', { click: 'Add menu item' }, { wait: 800 }), 'Choose Menu item, then enter the name, price and category.'),
  S('restaurant-orders', 'restaurant', go('/orders', { wait: 900 }), 'The Orders screen with sample tables and open orders.', { highlight: { text: 'New order' } }),
  S('restaurant-new-order', 'restaurant', go('/orders', { click: 'New order' }, { wait: 800 }), 'Choose the order type, add dishes and tap Send to kitchen.', { highlight: { text: 'Send to kitchen' } }),
  S('kitchen-board', 'restaurant', go('/kitchen', { wait: 900 }), 'The Kitchen screen: dishes waiting to start, being made and ready to serve.', { placements: [['restaurant/kitchen']] }),
  S('kitchen-start', 'restaurant', go('/kitchen', { wait: 900 }), 'Tap Start when cooking begins.', { highlight: { text: 'Start' } }),
  S('kitchen-ready', 'restaurant', go('/kitchen', { wait: 900 }), 'Tap Ready on each item when it is cooked, then Served when it reaches the guest.', { highlight: { text: 'Ready' } }),
  S('restaurant-reports', 'restaurant', go('/more/restaurant-reports', { wait: 900 }), 'Restaurant reports.', { placements: [['restaurant/reports']] }),
  S('bakery-production', 'bakery', go('/more/production', { wait: 900 }), 'The Production screen of a sample bakery. Tap Record production after a bake.', { highlight: { text: 'Record production' } }),
  S('bakery-production-form', 'bakery', go('/more/production', { click: 'Record production' }, { wait: 700 }), 'Choose what you made and how many. Ingredients go down and finished stock goes up.'),

  // ---- H. Catering
  S('catering-home', 'catering', go('/events', { wait: 900 }), 'The Catering home screen with upcoming events. Tap New enquiry to start one.', { highlight: { text: 'New enquiry' } }),
  S('catering-event-form', 'catering', go('/events/new', { wait: 900 }), 'The new enquiry form: event details, package and services. The price updates as you go.', { highlight: { text: 'Package' } }),
  S('catering-events', 'catering', go('/events/list', { wait: 900 }), 'The list of catering events and their stages.', { placements: [['catering/bookings']] }),
  S('catering-event-payments', 'catering', go('/events/list', { click: 'Bassey church anniversary' }, { click: 'Payments' }, { wait: 700 }), 'The Payments tab of an event. Tap Record payment when money arrives.', { highlight: { text: 'Record payment' } }),
  S('catering-event-prep', 'catering', go('/events/list', { click: 'Bassey church anniversary' }, { click: 'Preparation' }, { wait: 700 }), 'The Preparation tab: a checklist and the ingredients needed.', { highlight: { text: 'Food is ready' } }),
  S('catering-packages', 'catering', go('/more/catering-packages', { wait: 900 }), 'Catering packages with their prices. Tap New package to add one.', { highlight: { text: 'New package' } }),
  S('catering-package-form', 'catering', go('/more/catering-packages', { click: 'New package' }, { wait: 700 }), 'Name the package, set the price per guest and list the ingredients per guest.'),
]

const V = (step, shot, title, callout, extra = {}) => ({ step, shot, title, callout, ...extra })

export const VISUAL = {
  'getting-started/create-account': [
    V(1, 'site-home', 'Choose Start free trial', 'Start free trial'),
    V(2, 'register-form', 'Enter your details', 'The sign-up form', { caption: 'Enter your name, email, optional phone and a password of 8 to 72 characters.' }),
    V(4, 'register-submit', 'Tap Create account', 'Create account'),
  ],
  'getting-started/business-setup': [
    V(1, 'onboarding-type', 'Choose what you sell', 'Continue'),
    V(2, 'onboarding-details', 'Enter your business name', 'Business name'),
    V(3, 'onboarding-address', 'Pick your store address', 'Store address'),
  ],
  'products/create-product': [
    V(1, 'products-add', 'Open Products and tap Add product', 'Add product'),
    V(3, 'product-form-name', 'Enter the product name', 'Product name'),
    V(6, 'product-form-price', 'Enter the price and stock', 'Selling price'),
    V(7, 'product-form-more', 'Add optional details', 'More details'),
    V(8, 'product-saved', 'Save, then check the product list', 'New product'),
  ],
  'products/edit-product': [
    V(1, 'products-open-row', 'Open the product', 'Tap the product'),
    V(2, 'product-edit', 'Change what you need', 'Price field'),
  ],
  'products/stock-adjustments': [
    V(1, 'stock', 'Open the Stock screen'),
    V(3, 'stock-adjust', 'Choose what happened', 'Adjustment choices'),
  ],
  'sales/make-a-sale': [
    V(1, 'sell-open', 'Open the Sell screen'),
    V(3, 'sell-screen', 'Add the products'),
    V(4, 'sell-customer', 'Choose a customer (optional)', 'Choose customer'),
    V(6, 'sell-payment', 'Choose how they are paying', 'Confirm sale'),
  ],
  'sales/complete-transactions': [
    V(2, 'sell-payment', 'Confirm the sale', 'Confirm sale'),
    V(3, 'sell-receipt', 'Print the receipt or start a new sale', 'New sale'),
  ],
  'storefront/activate-store': [
    V(1, 'nav-online-store', 'Open More, then Online store', 'Online store'),
    V(3, 'store-settings', 'Turn on Open my store to customers', 'Open my store'),
    V(6, 'store-settings-save', 'Save your store settings', 'Save store settings'),
  ],
  'storefront/add-products': [
    V(1, 'product-form-name', 'Add the product in Products', 'Product name'),
    V(4, 'product-edit', 'Open the product to choose a category and photo', 'Product details'),
    V(5, 'store-public', 'Check it in your store', 'Your store'),
  ],
  'storefront/customer-view': [
    V(1, 'store-public', 'A customer opens your store link', 'Add to cart'),
    V(4, 'store-cart', 'They review their cart and tap Checkout', 'Checkout'),
    V(5, 'store-checkout', 'They fill in the checkout form', 'Name and phone'),
    V(6, 'store-order-placed', 'They see their order page'),
  ],
  'storefront/receiving-orders': [
    V(1, 'online-orders', 'Open More, then Online orders'),
    V(2, 'order-detail', 'Open the order'),
  ],
  'orders/process-orders': [
    V(1, 'order-new', 'Open a New order and confirm it', 'Confirm order', { caption: 'A new order. Check the items, then tap Confirm order.' }),
    V(4, 'order-confirmed', 'Mark it ready when it is packed', 'Mark as ready'),
    V(5, 'order-ready', 'Complete it when the customer has it', 'Payment received'),
  ],
  'orders/fulfilment': [
    V(1, 'order-ready', 'Open the ready order', 'Payment received'),
  ],
  'purchasing/suppliers': [
    V(2, 'suppliers', 'Open the Suppliers tab', 'Add supplier'),
    V(3, 'supplier-form', 'Enter the supplier details'),
  ],
  'purchasing/receive-stock': [
    V(1, 'purchases-hub', 'Tap Receive stock', 'Receive stock'),
    V(3, 'new-purchase', 'Add what you received, the quantity and the cost'),
  ],
  'purchasing/supplier-balances': [
    V(2, 'supplier-detail', 'Open a supplier to see what you owe', 'Record a payment'),
  ],
  'restaurant/menu-items': [
    V(1, 'menu-items', 'Open Menu and tables', 'Add menu item'),
    V(2, 'menu-item-form', 'Choose Menu item and enter the details'),
  ],
  'restaurant/orders': [
    V(1, 'restaurant-orders', 'Open Orders'),
    V(4, 'restaurant-new-order', 'Add dishes and send them to the kitchen', 'Send to kitchen'),
  ],
  'restaurant/kitchen': [
    V(2, 'kitchen-start', 'Start cooking', 'Start'),
    V(3, 'kitchen-ready', 'Mark items ready, then served', 'Ready'),
  ],
  'restaurant/bakery': [
    V(1, 'bakery-production', 'Open Production', 'Record production'),
    V(2, 'bakery-production-form', 'Say what you made and how many'),
  ],
  'catering/events': [
    V(1, 'catering-home', 'Open Events and tap New enquiry', 'New enquiry'),
    V(3, 'catering-event-form', 'Choose a package and services', 'Package'),
  ],
  'catering/packages': [
    V(1, 'catering-packages', 'Open Packages and services', 'New package'),
    V(2, 'catering-package-form', 'Name the package and set the prices'),
  ],
  'catering/payments': [
    V(1, 'catering-event-payments', 'Open the event\'s Payments tab', 'Record payment'),
  ],
  'catering/preparation': [
    V(1, 'catering-event-prep', 'Use the Preparation tab', 'Food is ready'),
  ],
  'employees/add-team': [
    V(1, 'team', 'Open Team', 'Add team member'),
    V(2, 'team-form', 'Enter their details and choose a role'),
  ],
  'employees/permissions': [
    V(1, 'role-form', 'Create a role and choose its permissions'),
  ],
  'branches/create-branch': [
    V(1, 'branches', 'Open Locations', 'Add location'),
    V(2, 'branch-form', 'Enter the location details'),
  ],
  'branches/transfer-stock': [
    V(1, 'transfers', 'Open Stock transfers', 'Send stock'),
    V(2, 'transfer-form', 'Choose from, to, and the products'),
  ],
  'finance/expenses': [
    V(1, 'expenses', 'Open Expenses', 'Add expense'),
    V(2, 'expense-form', 'Enter what it was for and the amount'),
  ],
  'finance/cash-accounts': [
    V(1, 'accounts', 'Add a cash or bank account', 'Add account'),
  ],
}
