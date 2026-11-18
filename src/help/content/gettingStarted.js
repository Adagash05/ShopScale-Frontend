import { article, h, list, p, steps, tip, warn, illus, shot } from './b.js'

export default {
  id: 'getting-started', title: 'Getting Started', icon: 'rocket',
  desc: 'Create your account, set up your business and find your way around.',
  articles: [
    article('what-is-shopscale', 'What is ShopScale?', 'A simple app to run sales, stock, customers, money and an online store from your phone.', [
      p('ShopScale is a business app for small and growing businesses in Nigeria. It replaces the notebook, calculator and WhatsApp chats you may use today with one place that keeps your records straight.'),
      h('What you can do with it'),
      list('**Sell** in your shop or on the go and print a receipt.', '**Keep stock** for every product, with a warning when something runs low.', '**Track customers** and see who owes you money.', '**Record expenses** so your profit is accurate.', '**Open an online store** where customers order and pay with Paystack.', '**Buy from suppliers** and see what you owe each one.', '**Add staff** and give each person only the access they need.', '**Run a restaurant, bakery or catering business** with menus, a kitchen screen, production and events.'),
      h('Who it is for'),
      p('Shops and retailers, wholesalers, restaurants, bakeries and caterers. When you set up, you choose the kind of business you run and ShopScale shows the tools that fit it. See [Choosing your business type](/help/getting-started/business-type).'),
      tip('You do not need to be an accountant. ShopScale uses plain words like "Money received" and "Customers who owe you".'),
    ], { related: ['getting-started/create-account', 'getting-started/first-steps'], keywords: 'about overview introduction' }),

    article('create-account', 'Creating an account', 'Sign up with your name, email and a password. The 14-day free trial needs no card.', [
      p('Your account is your personal sign-in. It is created first; your business is set up straight after.'),
      h('Steps'),
      steps('Open the ShopScale website and choose **Start free trial**.', 'Enter **Your name**, **Email** and, if you like, your **Phone**.', 'Choose a **Password** of 8 to 72 characters. It cannot be only spaces.', 'Tap **Create account**.', 'Check your email for a message from ShopScale and confirm your address. A notice at the top of the app stays until you do.'),
      p('Registration says "14 days free. No card needed." You will not be asked for payment details to start.'),
      h('What happens next'),
      p('You are taken to the business set-up screens. See [Setting up your business](/help/getting-started/business-setup).'),
      warn('Use an email address you can open. It is used to confirm your account and to reset your password.'),
      h('If something goes wrong'),
      list('"Use at least 8 characters": make the password longer.', 'Email already registered: use [Forgot password](/help/troubleshooting/forgot-password) or sign in instead.', 'No confirmation email: use **Send the email again** on the notice, then check your spam folder.'),
    ], { related: ['getting-started/business-setup', 'troubleshooting/cannot-log-in'], keywords: 'sign up register trial' }),

    article('business-type', 'Choosing your business type', 'Pick Shop, Restaurant, Bakery or Catering so ShopScale shows the right tools.', [
      p('The first set-up screen asks "what do you sell?". This decides which tools appear in your menu.'),
      h('The options'),
      list('**Shop or retail business**: fashion, cosmetics, electronics, groceries and general goods. You get selling, stock, customers, suppliers and the online store.', '**Restaurant or food business**: a menu, tables, orders that reach the kitchen screen, recipes and wastage.', '**Bakery**: bakery products, simple production recording, finished-product stock and custom cake orders with deposits.', '**Catering or small chops**: events, packages, quotations, deposits, preparation and event profit.'),
      p('On the next screen you choose a more specific kind, for example Cake shop, Cafe or Small chops. That is a label for your business.'),
      p('If you sell in bulk, a shop or retail business can also use **Wholesale prices** from the More menu when your plan includes it.'),
      tip('Not sure? Choose the one closest to how most of your money comes in. Sales, stock, customers, expenses and staff tools work for every business type.'),
      warn('The restaurant, bakery and catering tools are turned on by the type you choose here. If you chose the wrong one, contact ShopScale Support and we will help.'),
    ], { related: ['getting-started/business-setup', 'restaurant/set-up'] }),

    article('business-setup', 'Setting up your business', 'Choose what you sell, name your business and pick your store address.', [
      p('After you create your account you are asked three short questions. It takes about two minutes.'),
      steps('**What do you sell?** Choose your business type (see [Choosing your business type](/help/getting-started/business-type)) and tap **Continue**.', '**About your business.** Enter your **Business name**. This appears on receipts and in your online store. Choose the kind of business and, if you like, a **Business phone**. Tap **Continue**.', '**Pick your store address.** It starts from your business name. ShopScale checks that it is free as you type and tells you if someone already has it.', 'Confirm. Your business is created and your 14-day free trial begins.'),
      p('You can go **Back** at any step to change an answer.'),
      h('Your store address'),
      p('Your store address is the web link customers will use if you open an online store. Choose it carefully, because customers and links will use it.'),
      h('What happens next'),
      p('You land on your dashboard. Follow [Your first steps after registration](/help/getting-started/first-steps).'),
    ], { related: ['getting-started/dashboard', 'getting-started/first-steps'] }),

    article('dashboard', 'Understanding your dashboard', 'The Home screen shows sales, money received, expenses, profit and what needs attention.', [
      p('Home is the first screen you see. It answers: "How is my business doing?"'),
      h('The numbers at the top'),
      list('**Sales**: the value of what you sold in the period you picked.', '**Money received**: payments and repayments that actually came in. Sales on credit do not count as money received until the customer pays.', '**Expenses**: costs you recorded.', '**Estimated profit**: sales minus what the products cost you, minus expenses. It is an estimate because it relies on the cost prices you entered.'),
      h('Below the numbers'),
      list('**Sales and expenses** by day, so you can see good and slow days.', '**Gross profit by day** and **Best sellers**.', '**How customers paid**: cash, transfer or card.', '**Stock running low**: items to restock.', '**Customers who owe you** and the **Value of your stock (at cost)**.', '**Latest sales** with a link to the full list.'),
      p('Use the period buttons to switch between today, the last 7 days and this month. Tap **How are these worked out?** to see how each figure is calculated.'),
      tip('What you see depends on your role. A cashier may not see profit; the owner sees everything.'),
    ], { related: ['getting-started/navigation', 'finance/overview'], keywords: 'home overview profit' }),

    article('navigation', 'Understanding the navigation', 'The bottom bar has your main screens. Everything else is under More.', [
      p('ShopScale is built for phones first, so the main screens are along the bottom of the screen. On a larger screen the same items appear in a menu down the left.'),
      h('The main screens'),
      list('**Home**: your dashboard.', '**Sell**: record a sale.', '**Products**: your items and stock.', '**Customers**: who you sell to and who owes you.', '**More**: everything else.'),
      p('Restaurant and catering businesses also get **Orders**, **Kitchen** and **Events** in the bar.'),
      h('Inside More'),
      p('More lists the rest of your tools, each with a short hint: Online orders, Online store, Money overview, Cash and bank, Expenses, Suppliers, Locations, Team, Plan and billing, Settings and Help. You only see what your plan and role allow.'),
      tip('If a tool you expect is missing, either your plan does not include it ([Understanding subscriptions](/help/getting-started/subscriptions)) or your role does not allow it ([Roles and permissions](/help/employees/permissions)).'),
    ], { related: ['getting-started/dashboard', 'employees/permissions'] }),

    article('business-information', 'Configuring business information', 'Update your name, phone, email and address in Settings.', [
      p('Your business details appear on receipts and in your online store, so keep them correct.'),
      steps('Open **More**, then **Settings**.', 'Change **Business name**, **Phone**, **Email** or **Address**, or the **About your business** text.', 'Tap **Save settings**.'),
      p('You need the settings permission to change these details. Without it the screen is read-only.'),
      tip('Your store address is shown in Settings, but it was fixed when you set up. Your online store details such as the store name and description are changed under **More, Online store**.'),
    ], { related: ['settings/business-details', 'storefront/customise-store'] }),

    article('subscriptions', 'Understanding subscriptions', 'Start on a 14-day free trial, then pick the plan that suits you or stay on Free.', [
      p('ShopScale has a **Free** plan and paid plans called **Essential**, **Growth** and **Business**. Each paid plan includes more users, locations and tools.'),
      h('Your free trial'),
      p('Your 14-day trial starts when you create your business and needs no card. When it ends, your data is kept safe and nothing is deleted; your account moves to the Free plan unless you choose a plan.'),
      h('Where to manage your plan'),
      p('Open **More, Plan and billing**. You can see your current plan, when the period ends and your payment details, and you can choose or change a plan. See [Managing subscription plans](/help/settings/plans).'),
      warn('The online store needs Essential or above. A custom domain for your store needs the Business plan. If your plan does not include a tool, the screen says so and links to the plans.'),
    ], { related: ['settings/plans', 'settings/billing'] }),

    article('first-steps', 'Your first steps after registration', 'Add products, record a sale and open your store in about 15 minutes.', [
      p('Do these in order. Each step builds on the one before.'),
      steps('**Add your products.** Open Products and tap **Add product**. You only need a name, a price and how many you have. See [Creating products](/help/products/create-product).', '**Check your stock.** Open **More, Stock** to see counts and what is running low.', '**Record a sale.** Tap **Sell**, tap a product, check the total and confirm. See [Making a sale](/help/sales/make-a-sale).', '**Record an expense.** Open Expenses and add rent, transport or other costs so your profit is correct.', '**Add your team.** Invite staff from **More, Team** and give each a role.', '**Open your online store** (Essential plan or above). See [Activating your online store](/help/storefront/activate-store).'),
      tip('Add a few products first and sell one. Seeing stock go down by itself is the quickest way to understand the app.'),
      p('Need a hand? [Contact ShopScale Support](/help) using the email and WhatsApp buttons at the bottom of any page.'),
    ], { related: ['products/create-product', 'sales/make-a-sale', 'storefront/activate-store'], keywords: 'start beginner onboarding' }),
  ],
}
