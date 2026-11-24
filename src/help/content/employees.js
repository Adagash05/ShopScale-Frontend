import { article, h, list, p, steps, tip, warn } from './b.js'

export default {
  id: 'employees', title: 'Employees and Team', icon: 'users',
  desc: 'Invite staff, give each person the right access and keep control.',
  articles: [
    article('add-team', 'Adding and inviting team members', 'Send an invitation link. They join with their own sign-in.', [
      steps('Open **More, Team** and tap **Add team member**.', 'Enter their **Name** and **Email**, and optionally a **Phone**.', 'Choose a **Role** (see [Assigning roles](/help/employees/roles)).', 'Tap **Send invitation**. "Invitation created" appears.'),
      p('They get an email with a link to join. If email is not set up on the server, the screen tells you and shows a link you can copy and send yourself.'),
      list('Under **Invitations** you can **Resend** (a fresh link; the old one stops working) or **Cancel** an invitation.', 'Your plan sets how many team members you can have.'),
      warn('Never share your own sign-in. Invite each person so every action is recorded under their name.'),
    ], { related: ['employees/roles'] }),

    article('roles', 'Assigning roles', 'A role is a set of things a person is allowed to do.', [
      p('ShopScale has built-in roles: **Owner**, **Administrator**, **Manager**, **Sales staff**, **Inventory staff**, **Kitchen staff** and **Accountant**. You can also create your own.'),
      steps('Open **More, Team**.', 'Tap a team member, then **Change role**.', 'Choose a role. A short summary under it shows **What this role can do**.', 'Save. "Role updated" appears.'),
      tip('You can only give roles that have no more access than you have.'),
    ], { related: ['employees/permissions', 'employees/manage-access'] }),

    article('permissions', 'Understanding roles and permissions', 'Choose exactly what each person can see and do.', [
      p('A permission is one action, such as recording a sale, giving a discount or viewing reports. A role bundles permissions.'),
      h('Making your own role'),
      steps('Open **More, Team** and tap **New role**.', 'Give the role a name and describe what it is for.', 'Optionally **Start from** an existing role.', 'Turn on the permissions you want. You can only turn on permissions you have yourself.', 'Tap **Create a role** (you must choose at least one).'),
      p('Use **See access** on a role to review it, **Copy as a custom role** to customise a built-in one, and **Delete** for a custom role you no longer need.'),
      warn('If someone cannot see a menu item or button, it is almost always a permission. See [Employee cannot access a feature](/help/troubleshooting/employee-access).'),
    ], { related: ['employees/roles', 'troubleshooting/employee-access'], keywords: 'access rights' }),

    article('manage-access', 'Managing employee access', 'Change a role or remove access any time.', [
      list('**Change role** moves someone to a different set of permissions.', '**Remove access** stops them signing in to your business ("Access removed").', '**Restore access** brings them back ("Access restored").'),
      p('Removing access keeps everything they recorded. History is never deleted.'),
      p('The **Activity history** under More shows who did what, if your role allows. It is included in the Growth and Business plans.'),
    ], { related: ['employees/roles'] }),

    article('cashiers', 'Understanding cashier operations', 'Sales staff record sales; shifts let you reconcile the till.', [
      p('Give cashiers the **Sales staff** role (or a custom role). They can use **Sell** and the sales permissions you choose, without seeing money overviews or settings.'),
      h('Cashier shifts'),
      steps('At the start of the day open **More, Cashier shifts** and tap **Start your shift**.', 'Enter **Working at** (the location) and the **Cash in the till at the start (₦)**.', 'At the end tap **Close your shift** and enter the **Cash counted (₦)**.'),
      p('The shift compares what the till **Should hold** with what was **Counted**. A manager with permission marks it **Reviewed**. See [Cashier reconciliation](/help/finance/cashier-reconciliation).'),
    ], { related: ['finance/cashier-reconciliation'] }),
  ],
}
