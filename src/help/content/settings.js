import { article, h, list, p, steps, tip, warn } from './b.js'

export default {
  id: 'settings', title: 'Business Settings and Account', icon: 'settings',
  desc: 'Business details, your plan, billing and keeping your account safe.',
  articles: [
    article('business-details', 'Updating business details', 'Name, phone, email and address on receipts and your store.', [
      steps('Open **More, Settings**.', 'Edit **Business name**, **Phone**, **Email**, **Address** or **About your business**.', 'Tap **Save settings**.'),
      p('The setting **Let me sell items even when my stock count says zero** is here too.'),
    ], { related: ['getting-started/business-information'] }),

    article('account', 'Managing account settings', 'Switch business, sign out, notifications and devices.', [
      list('**Switch business** on the More screen if you belong to more than one.', '**Notifications** list alerts such as new online orders.', '**Sign out** at the bottom of More.', 'Reset a forgotten password with [Forgot password](/help/troubleshooting/forgot-password).'),
      steps('Open **More** to see your name and your business.', 'Use **Notifications** to read alerts and **Mark all as read**.', 'Use **Sign out** when you share a phone.'),
    ], { related: ['troubleshooting/cannot-log-in'] }),

    article('plans', 'Managing subscription plans', 'Choose, change or cancel a plan.', [
      steps('Open **More, Plan and billing**.', 'See your **Current plan**, **Status** and **Current period ends**.', 'Choose a plan and follow the payment steps. Payment is processed by Paystack.', 'When payment is confirmed you see "Payment confirmed. Your plan is active."'),
      list('If you change plan during a period, you get **credit for unused time** on your current plan.', 'If a subscription ends, your account becomes read-only: your data is safe and you can still view everything. Choose a plan to record new activity.'),
      warn('"Move to the Free plan" keeps your data but features and limits beyond Free stop for new activity.'),
    ], { related: ['settings/billing', 'getting-started/subscriptions'] }),

    article('billing', 'Managing billing and automatic renewal', 'See your card, next renewal and cancel any time.', [
      p('Plans renew automatically with the card you paid with, saved securely by Paystack.'),
      list('**Next renewal**, **Payment method** and **Last successful payment** are shown on Plan and billing.', '**Update payment method** or **Add payment method** keeps renewal working.', '**Cancel subscription** stops further charges; access continues until the period ends.', '**Resume subscription** turns renewal back on.'),
      p('If a renewal fails ShopScale says so and does not keep retrying silently. Update your payment method and check the status.'),
    ], { related: ['settings/plans'] }),

    article('export', 'Exporting available records', 'Download your data as CSV.', [
      p('Use **More, Export data**. See [Exporting your records](/help/finance/export-records).'),
      p('You can download **Products and stock** and **Customers and what they owe**. Export depends on your plan and role.'),
    ], { related: ['finance/export-records'] }),

    article('security', 'Security and permissions', 'Keep your business safe.', [
      list('Give each person their own sign-in and the least access they need.', 'Remove access when someone leaves.', 'Never share your password.', 'Your Paystack secret key is stored encrypted and never shown again.', 'Activity history shows who did what.'),
      warn('Never send your password or Paystack secret key to anyone, including by WhatsApp.'),
    ], { related: ['employees/permissions'] }),
  ],
}
