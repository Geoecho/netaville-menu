# Netaville × Eightysix menu

A display-only menu and staff workspace built with Next.js, React and Supabase.

## Start locally

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill the two public Supabase values in .env.local, then:
npm run dev
```

This checkout already has the supplied public credentials in the ignored `.env.local`. Do not overwrite that file unless changing projects. Open `http://localhost:3000` for the display and `http://localhost:3000/admin` for staff.

## Supabase setup (required before publishing)

1. Open your project's SQL editor and run **supabase/setup.sql**. It creates the menu tables, access policies and public image bucket. It does not delete existing menu data.
2. In **Authentication → Users → Add user**, create an email/password account and auto-confirm its email. You do not need to send an invitation.
3. Copy the new user's UUID. Run the following separately in the SQL editor, replacing the placeholder:

```sql
insert into public.menu_admins (user_id)
values ('YOUR-USER-UUID')
on conflict do nothing;
```

4. Sign in at `/admin`, review the starter products, then click **Publish initial menu**.
5. Under **Branding**, review the included original Netaville and Eightysix logos. The collaboration strip shows only the two images and an × separator. Both logos have independent sizing controls and can be replaced with PNG/WebP/JPG uploads; brand names remain available as accessible image labels without added visible text.
6. Under **Student banner**, the original QR code is shown by default. Set a destination URL to replace it with an automatically generated QR code; leaving the URL empty keeps the original.

Only a project URL and publishable key are used by the app. Never put a service-role key or database password in a `NEXT_PUBLIC_` variable. In a hosted deployment, add the two environment variables before building. Staff accounts are provisioned and revoked through the Supabase dashboard in this version; staff all have the same menu-editing permissions.

## Editing and publishing

- **Menu & offers:** create/edit/delete/reorder products; descriptions, prices, labels, images, allergens, sizes and extras; visibility and featured status; student prices and optional start/end times.
- **Stock:** manual available/low/sold-out status, optional whole-number quantity, low-stock threshold, and mark available. A quantity of zero always means sold out. A blank quantity uses manual status.
- **Categories:** rename, show/hide, reorder, add and delete empty categories. Hiding a category removes its products from all public tabs and suggestions.
- **Branding:** both brand names, logo uploads/URLs and sizes, strip visibility, background and text colour.
- **Display:** accent, background, text, currency, slideshow interval, sold-out visibility, surprise button and tab/empty-state labels.
- **Student banner:** visibility, title, description and QR destination.
- **Preview** shows unpublished changes. **Publish changes** saves the entire draft atomically. Separate display screens check for updates every 15 seconds. A version check prevents one staff member silently overwriting another's publication; reload the published menu and reapply your changes after a conflict.

Stock is manually maintained. There is no ordering, POS integration, ingredient inventory, automatic deduction or automatic replenishment. Offer dates control the secondary student price shown on product details; there is no separate Student offers tab. Recommended and visible category tabs remain available even when empty; automatic rotation skips empty tabs. Regular category listings remain visible. Dates are entered in the staff browser's local time and stored as UTC. Currency is a display label, not a conversion.

## Images

The `menu-images` bucket serves public PNG/JPG/WebP files up to 5 MB. Uploads require an authenticated allowlisted staff account. Unique filenames avoid overwriting cached images. Use transparent PNG/WebP logos; use a light logo when choosing a dark brand strip. Uploads happen before publishing, so cancelling an edit can leave an unused file. Cleanup is manual through Supabase Storage. Product photos and uploaded logos are served directly; no paid image-resizing service is required.

Each product supports multiple photos. In the product editor, choose several files with **Upload images**, then reorder, remove, or set a cover using the thumbnail controls. The first image is the cover. Uploads run at most three at a time; individual failures are listed and **Retry failed uploads** resends only those files. Successful uploads stay in the draft. Click **Apply to draft**, then **Publish changes** to update display screens.

Both the main display and surprise sheet show the product gallery. Photos rotate using the display interval, with swipe, keyboard and slim image indicators for manual selection; there are no arrow controls. A product stays on screen long enough to show its photos before rotation moves to the next product. Photo rotation pauses on hover/focus and respects reduced-motion preferences. Branding logo uploads remain single-image controls.

No database migration is needed: galleries add an optional `images` array inside each existing JSON product. `imageUrl` is retained and updated to the cover for compatibility with older records and display versions. Existing products continue to show their original image. Removing a photo removes its reference from the menu, not the underlying storage file.

## Data and access

`menu_config` is a single versioned JSON document containing the small display menu and settings. Publishing it as one row keeps product, category and branding changes consistent. `menu_admins` is a separate allowlist linked to Supabase Auth. Database row-level security grants public read access to the published menu and restricts writes to staff. The browser cannot grant itself membership. Removing a staff allowlist row prevents further publications and uploads.

The old `/api/promotions*` and `/api/upload` routes have been retired, along with Vercel Postgres/Blob dependencies. Existing remote records are not modified or automatically migrated. If an older deployment has real products, export/re-enter them before switching that deployment to this version. The old `netaville_promotions` browser storage is not imported into the new menu model.

With both Supabase environment values absent, the app explicitly runs as a local demo using browser storage. Demo changes do not sync to other devices. Once credentials are configured, read/write errors are shown; the app never silently falls back to local saving. The public display keeps its last successfully fetched menu during temporary connection errors. Before the first publication, an empty configured table displays the starter menu. Missing tables are reported as errors.

## Checks

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

`npm test` runs the TypeScript domain/storage modules in-process using Node's test runner. Tests cover availability, visibility, offer scheduling, malformed input, persistence, conflicting publications and failure behaviour. Database policy enforcement, real uploads and login require the Supabase setup and a real staff session; mocked storage tests do not verify remote policies. The two unchanged Magic UI helpers may report pre-existing unused-variable lint warnings.

In the managed agent environment, starting Next.js may fail with `spawn EPERM`. Run `npm run dev` from your own terminal if that occurs. Browser and live Supabase checks must be completed after the setup steps above.
