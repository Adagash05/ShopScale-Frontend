/**
 * Single source of truth for Help Centre screenshots. Pure data: read by the Help Centre (data.js places each image inside its
 * article) and by scripts/capture-help-screenshots.mjs (which captures the real image from a running ShopScale).
 *
 *  id          file name: public/help/shots/<id>.png
 *  account     which demo business to sign in as (scripts/demo/demo-config.mjs); omit for public pages (the online store)
 *  steps       what the capture script does in the REAL app before taking the picture:
 *                { goto: '/path' }  { waitText: 'text' }  { click: 'text' }  { clickCss: 'selector' }  { fill: '#id', value: '...' }  { wait: ms }
 *                {slug} in a path is replaced by the demo store's slug
 *  placements  [articlePath, caption?, after?]   where it appears. after: 'steps' (default, right after the first numbered steps), 'start', 'end'
 *
 * An image is shown only if its file exists, so an uncaptured shot never leaves a gap or a broken picture.
 * Captions describe the screen; they make no claim about data that may differ on a real account.
 */
export const SHOTS = [
  // ---- A. Getting started
  { id: 'dashboard', account: 'retail', steps: [{ goto: '/dashboard' }, { wait: 1200 }],
    caption: 'The dashboard of the sample business Aminu Stores, the first screen after you sign in.',
    placements: [['getting-started/dashboard']] },
  { id: 'more-menu', account: 'retail', steps: [{ goto: '/more' }, { wait: 800 }],
    caption: 'The More screen lists the other tools available to your business.',
    placements: [['getting-started/navigation']] },
  { id: 'business-settings', account: 'retail', steps: [{ goto: '/more/settings' }, { wait: 800 }],
    caption: 'Settings, where your business name and contact details are kept.',
    placements: [['getting-started/business-information'], ['settings/business-details']] },
  { id: 'plan', account: 'retail', steps: [{ goto: '/more/plan' }, { wait: 800 }],
    caption: 'The Plan screen shows your current plan and what it includes.',
    placements: [['settings/plans']] },

  // ---- B. Products and inventory
  { id: 'products-list', account: 'retail', steps: [{ goto: '/products' }, { waitText: 'Mama Gold Rice 50kg' }],
    caption: 'The Products list with sample products and their prices and stock.',
    placements: [['products/understand-inventory', undefined, 'start']] },
  { id: 'product-form', account: 'retail',
    steps: [{ goto: '/products/new' }, { fill: '#pname', value: 'Sample Product' }, { fill: '#pprice', value: '2500' }, { fill: '#pqty', value: '20' }, { wait: 500 }],
    caption: 'The Add product screen with a name, price and stock filled in for a sample item.',
    placements: [['products/create-product'], ['storefront/add-products', 'Add the product first. It must be active and have a price to appear in your store.']] },
  { id: 'product-edit', account: 'retail', steps: [{ goto: '/products' }, { click: 'Mama Gold Rice 50kg' }, { wait: 1000 }],
    caption: 'Opening a product lets you change its price, stock level and details.',
    placements: [['products/edit-product']] },
  { id: 'stock', account: 'retail', steps: [{ goto: '/more/stock' }, { wait: 1000 }],
    caption: 'The Stock screen lists what you have and flags items that are running low.',
    placements: [['products/manage-stock'], ['products/low-stock']] },

  // ---- E. Sales and POS
  { id: 'sell-screen', account: 'retail',
    steps: [{ goto: '/sell' }, { click: 'Mama Gold Rice 50kg' }, { click: 'Peak Milk Tin 400g' }, { click: 'Sugar 1kg' }, { wait: 600 }],
    caption: 'The Sell screen with three sample items added to the sale.',
    placements: [['sales/make-a-sale'], ['sales/add-products-to-sale']] },
  { id: 'sales-history', account: 'retail', steps: [{ goto: '/more/sales' }, { wait: 1000 }],
    caption: 'Sales history lists the sales you have recorded.',
    placements: [['sales/sales-history']] },
  { id: 'sales-report', account: 'retail', steps: [{ goto: '/more/sales-report' }, { wait: 1200 }],
    caption: 'The sales report for a chosen period.',
    placements: [['sales/reports']] },
  { id: 'customers', account: 'retail', steps: [{ goto: '/customers' }, { waitText: 'Alhaji Musa Lawal' }],
    caption: 'The Customers list with sample customers.',
    placements: [['sales/customers']] },
  { id: 'customer-detail', account: 'retail', steps: [{ goto: '/customers' }, { click: 'Alhaji Musa Lawal' }, { wait: 1000 }],
    caption: 'A customer record showing what they owe and their recent sales.',
    placements: [['finance/debtors']] },

  // ---- F. Purchasing
  { id: 'suppliers', account: 'retail', steps: [{ goto: '/suppliers' }, { waitText: 'Lagos Grains Wholesale Ltd' }],
    caption: 'The Suppliers list with sample suppliers.',
    placements: [['purchasing/suppliers']] },
  { id: 'supplier-detail', account: 'retail', steps: [{ goto: '/suppliers' }, { click: 'Lagos Grains Wholesale Ltd' }, { wait: 1000 }],
    caption: 'A supplier record showing the balance you owe and past purchases.',
    placements: [['purchasing/supplier-balances']] },
  { id: 'new-purchase', account: 'retail', steps: [{ goto: '/purchases/new' }, { wait: 1000 }],
    caption: 'The screen used to record stock you have received from a supplier.',
    placements: [['purchasing/receive-stock']] },
  { id: 'purchases', account: 'retail', steps: [{ goto: '/more/orders' }, { wait: 1000 }],
    caption: 'The list of purchases you have recorded.',
    placements: [['purchasing/purchasing-records']] },

  // ---- K. Finance
  { id: 'expenses', account: 'retail', steps: [{ goto: '/expenses' }, { wait: 1000 }],
    caption: 'The Expenses screen with sample expenses recorded.',
    placements: [['finance/expenses']] },
  { id: 'money', account: 'retail', steps: [{ goto: '/more/money' }, { wait: 1200 }],
    caption: 'The money overview.',
    placements: [['finance/overview']] },
  { id: 'accounts', account: 'retail', steps: [{ goto: '/more/accounts' }, { wait: 1000 }],
    caption: 'Cash and bank accounts.',
    placements: [['finance/cash-accounts']] },

  // ---- I and J. Employees and branches
  { id: 'team', account: 'retail', steps: [{ goto: '/more/team' }, { wait: 1000 }],
    caption: 'The Team screen, where you invite staff and choose their role.',
    placements: [['employees/add-team'], ['employees/roles']] },
  { id: 'branches', account: 'retail', steps: [{ goto: '/more/branches' }, { wait: 1000 }],
    caption: 'The Branches screen with a main location and a second branch.',
    placements: [['branches/manage-branches']] },
  { id: 'transfers', account: 'retail', steps: [{ goto: '/more/transfers' }, { wait: 1000 }],
    caption: 'Stock transfers between branches.',
    placements: [['branches/transfer-stock']] },

  // ---- C and D. Online storefront and online orders (a visual walkthrough, in order)
  { id: 'store-settings', account: 'retail', steps: [{ goto: '/more/store' }, { wait: 1200 }],
    caption: 'The Online store screen with "Open my store to customers" switched on.',
    placements: [['storefront/activate-store'], ['storefront/overview', 'Step 1. You open your online store from the Online store screen.'], ['storefront/store-url'], ['storefront/share-store']] },
  { id: 'store-public', steps: [{ goto: '/s/{slug}' }, { waitText: 'Add to cart' }, { wait: 800 }], viewport: 'mobile',
    caption: 'What a customer sees when they open your store link: your products with prices and an Add to cart button.',
    placements: [['storefront/customer-view'], ['storefront/preview'], ['storefront/overview', 'Step 2. A customer opens your store link and browses your products.']] },
  { id: 'store-cart', steps: [{ goto: '/s/{slug}' }, { waitText: 'Add to cart' }, { click: 'Add to cart' }, { click: 'Add to cart' }, { click: 'View cart' }, { wait: 800 }],
    caption: 'The customer\'s cart, with their items and quantities.',
    placements: [['storefront/overview', 'Step 3. The customer adds items to their cart.'], ['storefront/checkout']] },
  { id: 'store-checkout', steps: [{ goto: '/s/{slug}' }, { waitText: 'Add to cart' }, { click: 'Add to cart' }, { click: 'View cart' }, { fill: '#cn', value: 'Chioma Eze' }, { fill: '#cp', value: '08000030001' }, { click: 'Pay on' }, { wait: 500 }],
    caption: 'The checkout form: the customer enters their name and phone number, chooses pickup or delivery, and chooses how to pay. (The order has not been placed in this picture.)',
    placements: [['storefront/overview', 'Step 4. The customer fills in the checkout form and places the order.'], ['storefront/checkout', undefined, 'end']] },
  { id: 'online-orders', account: 'retail', steps: [{ goto: '/more/store-orders' }, { waitText: 'Online orders' }, { wait: 800 }],
    caption: 'The Online orders list with sample orders in different statuses.',
    placements: [['orders/understand-orders'], ['storefront/receiving-orders'], ['storefront/overview', 'Step 5. The order arrives in Online orders.']] },
  { id: 'order-detail', account: 'retail', steps: [{ goto: '/more/store-orders' }, { waitText: 'Online orders' }, { clickCss: 'main .list-item' }, { wait: 800 }],
    caption: 'An order open with its items, payment status and the next action button.',
    placements: [['orders/order-details'], ['orders/process-orders'], ['storefront/overview', 'Step 6. You open the order, confirm it, mark it ready, and complete it when the customer has it.']] },
  { id: 'online-orders-ready', account: 'retail', steps: [{ goto: '/more/store-orders' }, { waitText: 'Online orders' }, { click: 'Ready' }, { wait: 800 }],
    caption: 'The Ready tab lists orders that are packed and waiting for the customer.',
    placements: [['orders/fulfilment']] },

  // ---- G. Restaurant and kitchen
  { id: 'menu-items', account: 'restaurant', steps: [{ goto: '/more/menu' }, { wait: 1200 }],
    caption: 'The Menu screen with sample dishes and prices.',
    placements: [['restaurant/menu-items']] },
  { id: 'restaurant-orders', account: 'restaurant', steps: [{ goto: '/orders' }, { wait: 1200 }],
    caption: 'The Orders screen with sample tables and open orders.',
    placements: [['restaurant/orders']] },
  { id: 'kitchen-board', account: 'restaurant', steps: [{ goto: '/kitchen' }, { wait: 1200 }],
    caption: 'The Kitchen screen: dishes waiting to start, being made, and ready to serve.',
    placements: [['restaurant/kitchen']] },
  { id: 'restaurant-reports', account: 'restaurant', steps: [{ goto: '/more/restaurant-reports' }, { wait: 1200 }],
    caption: 'Restaurant reports.',
    placements: [['restaurant/reports']] },
  { id: 'bakery-production', account: 'bakery', steps: [{ goto: '/more/production' }, { wait: 1200 }],
    caption: 'The Production screen of a sample bakery, where batches made are recorded.',
    placements: [['restaurant/bakery']] },

  // ---- H. Catering
  { id: 'catering-home', account: 'catering', steps: [{ goto: '/events' }, { wait: 1200 }],
    caption: 'The Catering home screen with upcoming events.',
    placements: [['catering/events']] },
  { id: 'catering-events', account: 'catering', steps: [{ goto: '/events/list' }, { wait: 1200 }],
    caption: 'The list of catering events and their stages.',
    placements: [['catering/bookings']] },
  { id: 'catering-event-form', account: 'catering', steps: [{ goto: '/events/new' }, { wait: 1200 }],
    caption: 'The new enquiry form where you choose a package and services.',
    placements: [['catering/events']] },
  { id: 'catering-event-detail', account: 'catering', steps: [{ goto: '/events/list' }, { click: 'Bassey church anniversary' }, { wait: 1200 }],
    caption: 'An event showing its deposit, payments and preparation checklist.',
    placements: [['catering/payments'], ['catering/preparation']] },
  { id: 'catering-packages', account: 'catering', steps: [{ goto: '/more/catering-packages' }, { wait: 1200 }],
    caption: 'Catering packages with their prices.',
    placements: [['catering/packages']] },
]
