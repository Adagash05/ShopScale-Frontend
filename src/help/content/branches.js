import { article, h, list, p, steps, tip, warn } from './b.js'

export default {
  id: 'branches', title: 'Branch Management', icon: 'map',
  desc: 'Run more than one shop, kitchen or warehouse and move stock between them.',
  articles: [
    article('create-branch', 'Creating branches', 'Add a location for each shop, kitchen or warehouse.', [
      steps('Open **More, Locations** and tap **Add location**.', 'Enter a **Name**, and optionally **Address** and **Phone**.', 'Tap **Save location**. "Location saved" appears.'),
      p('Your plan sets how many locations you can have.'),
    ], { related: ['branches/manage-branches'] }),

    article('manage-branches', 'Managing branch information', 'Edit or switch off a location.', [
      list('Tap a location and **Edit location** to change its details.', 'A location can be **Switched off** when you no longer use it.', 'Sales, stock and cashier shifts name the location they happened at.'),
      p('If you try to add more locations than your plan allows, you are told the plan\'s limit and asked to upgrade. Nothing is deleted when a plan changes; free up locations first.'),
    ], { related: ['branches/branch-stock'] }),

    article('branch-stock', 'Understanding branch-specific stock', 'Each location has its own count for every product.', [
      p('The same product can have different quantities at different locations. When you sell, receive stock or adjust, choose the location (for example **Selling from** or **Receiving into**).'),
      p('Products show the quantity for your current location. Stock history records the location of each change.'),
      tip('If counts look wrong, first check that you are looking at the right location. See [Branch stock discrepancies](/help/troubleshooting/branch-stock).'),
    ], { related: ['branches/transfer-stock', 'troubleshooting/branch-stock'] }),

    article('transfer-stock', 'Transferring stock between branches', 'Send stock from one location to another.', [
      p('You need at least two locations. With one, the screen says "You have one location. Add another under Locations to move stock between them."'),
      steps('Open **More, Stock transfers** and tap **Send stock**.', 'Choose **From** and **To** (they must be different).', 'Search for each product and enter the quantity.', 'Add a note and save. "Transfer sent" appears.', 'At the receiving location tap **Mark as received**. "Stock received" appears.'),
      p('A transfer you have not received can be cancelled ("Transfer cancelled").'),
      warn('Stock only arrives at the other location once it is marked as received. Check the count when it physically arrives.'),
    ], { related: ['branches/branch-stock'] }),

    article('consolidated', 'Understanding consolidated operations', 'See the whole business, or one location at a time.', [
      list('Your dashboard and money overview combine all locations you can access.', '**Sales reports** can be broken down **by location**.'),
      p('To look at one location, choose it wherever the screen offers a location choice, such as when selling or receiving stock.'),
    ], { related: ['sales/reports'] }),
  ],
}
