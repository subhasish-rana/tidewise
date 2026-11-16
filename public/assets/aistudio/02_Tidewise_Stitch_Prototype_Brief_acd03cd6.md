# Tidewise — Google Stitch Prototype Brief

Use this document as the source brief for generating a high-fidelity, clickable **Android mobile app prototype** in Google Stitch.

## 1. Copy-ready master prompt for Stitch

Design a polished Android mobile application called **Tidewise** with the tagline **“Clean tides. Smarter communities.”** Tidewise is a community-powered platform for reporting waste at beaches, rivers, lakes and ponds, rating visible cleanliness, joining cleanup activities and tracking positive environmental contributions.

The prototype is for a solo-developer hackathon project in Odisha, India. Use Puri Beach, Chandipur Beach and urban water bodies in Bhubaneswar as sample locations, but make the map and reporting flow feel usable anywhere.

### Product experience

Make Tidewise welcoming to any member of the public. Do not create an institutional onboarding process, phone-number requirement, invitation code or role-selection step. New members register with **full name, email, age, password and confirm password**, then see an email-verification confirmation state. Returning members log in with email and password. Include a forgot-password flow. The app should feel like it remembers a member after login.

The key product journey is:

**Sign up / log in → explore the map → report a waste hotspot or rate a water body → inspect report status → find and join a cleanup activity → see points, badges and tier progress.**

### Visual direction

Create a distinctive, modern environmental-tech identity. Avoid a generic corporate dashboard, overly childish cartoon style or a copy of an existing maps/social app.

- Use a deep ocean-blue / navy base, clear turquoise and aqua accents, sea-glass teal for positive actions, and warm sand/off-white surfaces for readable content.
- Use gradients sparingly for hero areas and tier progress, not behind every card.
- Use subtle wave, current, contour and water-ripple motifs as background details.
- Use rounded cards, clean spacing, strong visual hierarchy and large readable labels.
- Use a contemporary sans-serif typeface with excellent readability.
- Use meaningful environmental photography for water bodies and cleanup activities; keep icons simple and consistent.
- The interface should feel trustworthy, optimistic, energetic and practical.
- Prioritize accessibility: readable contrast, large tap targets, clear labels, and do not communicate status by color alone.
- Design for a typical Android phone viewport. Respect safe areas and Android navigation conventions.

### Navigation

Use a persistent bottom navigation bar with five destinations:
1. **Home** — dashboard, quick report action and nearby activity.
2. **Explore** — map of water bodies and waste reports.
3. **Report** — prominent central action to submit a waste report.
4. **Drives** — cleanup activities to discover and join.
5. **Profile** — points, tier, badges and personal contributions.

The central Report action may be visually emphasized, but it must remain consistent with the bottom navigation.

### Screens to generate

Create the following connected screens and states. Keep the same design system across all of them.

#### 1. Welcome / sign-in entry
- Tidewise logo/wordmark and tagline.
- Short value statement: “Spot it. Tag it. Help clean it.”
- Primary action: Create account.
- Secondary action: Log in.
- Environmental image or subtle ocean-current illustration.

#### 2. Create account
- Fields: Full name, email, age, password, confirm password.
- Password visibility toggle and basic password guidance.
- Clear consent/privacy link placeholder.
- Primary button: Create account.
- Link for existing members to log in.
- No phone number, username, institution, invite code or role picker.

#### 3. Verify email state
- Confirmation that a verification email has been sent.
- Show the email address in a partially masked form.
- Actions: I have verified / Resend email / Back to sign-in.
- Design this as a state screen, not an extra registration form.

#### 4. Log in and forgot password
- Email and password fields.
- Password visibility toggle.
- Forgot password link.
- Log in button and link to create an account.
- Separate password-reset confirmation state.

#### 5. Home dashboard
- Greeting using the member's first name.
- Compact tier/points summary, for example “Minnow Scout · 120 points”.
- Large map preview with nearby waste hotspots and water-body pins.
- Strong “Report waste” quick action.
- “Explore nearby water bodies” horizontal cards.
- “Cleanup activities near you” preview.
- Small community-impact metrics such as reports resolved and cleanup activities completed.
- Keep this screen focused; do not turn it into a dense analytics dashboard.

#### 6. Explore map
- Large interactive map canvas using an Odisha coastal / Bhubaneswar sample map treatment.
- Markers for water bodies and waste reports, with distinct but restrained marker styles.
- Search field: “Search beaches, rivers, lakes…”
- Filter chips: All, Waste hotspots, Beaches, Rivers, Lakes & ponds, Needs cleanup, Resolved.
- A draggable or tappable bottom sheet for the selected marker, showing place/report name, category, status and a “View details” action.
- Include a selected location example from Puri or Bhubaneswar.

#### 7. Submit a waste report — location and photo
- Step indicator such as 1 of 3.
- Photo capture/upload card with camera and gallery actions and a clear photo preview state.
- Location section with “Use current location” and “Choose on map” actions.
- Show a map pin and readable place/coordinate summary.
- Optional description field.
- Continue button with disabled/validation state until required inputs are present.

#### 8. Submit a waste report — AI review and confirmation
- Display the uploaded photo.
- AI suggestion card with category (example: Plastic waste), confidence label and a short “AI suggestion — please confirm” explanation.
- Editable waste category chips: Plastic, Glass, Metal, Organic, Fishing gear, Mixed, Other.
- Severity selector: Low, Medium, High.
- Submit report button.
- Success state with report ID, mapped location and initial status “Submitted”.
- Explain that the report may be reviewed before cleanup assignment.

#### 9. Water-body details and rating
- Large photo header for a water body (example: Puri Beach, Chandipur Beach or a Bhubaneswar lake).
- Name, type, area and map/location snippet.
- Community cleanliness rating out of 5 with rating count and recent trend.
- Rating controls: 1–5 stars or clearly labelled scale.
- Short observation prompts about visible litter/cleanliness; optional comment and photo.
- Recent waste reports and cleanup activity linked to the water body.
- Important visible disclaimer: “Community cleanliness observations. Not a scientific water-quality or safety assessment.”
- Submit/update rating action.

#### 10. My reports and report detail
- List of the member's reports with thumbnail, waste category, place, date and status.
- Status labels: Submitted, Under review, Verified, Assigned, In progress, Resolved, Rejected or Duplicate.
- Detail page with report photo, map location, category, severity, timeline and moderator/cleanup updates.
- Use a clear timeline/progress component so users understand what happens next.

#### 11. Cleanup drives list and detail
- Drives screen with nearby/upcoming activities, location, date/time, organizer, participant count and available capacity.
- Filters such as Nearby, Upcoming and Joined.
- Drive detail screen with meeting point map, description, what to bring, organizer, participant count and Join drive action.
- After joining, show a clear Joined state and the activity under “My drives”.
- For the hackathon MVP, members can join published activities. Do not make public drive creation appear as a fully available feature; show “Create a drive — coming soon” only as a clearly disabled/future capability if needed.

#### 12. Rewards and profile
- Profile identity: name, avatar placeholder and contribution summary.
- Prominent tier card with name, aquatic emblem, points and progress to next tier.
- Use these proposed tiers exactly:
  - Tide Starter — 0–49 points
  - Minnow Scout — 50–149 points
  - Otter Ally — 150–299 points
  - Dolphin Defender — 300–599 points
  - Turtle Guardian — 600–999 points
  - Manta Keeper — 1,000–1,499 points
  - Ocean Sentinel — 1,500+ points
- Badge collection with examples: Riverkeeper, Pond Protector, Reef Ranger, Coastwatcher, Current Champion, Cleanup Crew.
- Tabs or sections for My reports, My drives, Badges and Points history.
- Simple leaderboard preview with privacy-conscious display names.
- Rewards catalogue may appear as “Coming soon”; do not imply real partner redemption is already active.

#### 13. Moderator review concept screen
- This is a supporting prototype screen, not part of public sign-up.
- Present a queue of submitted reports with photo, location, category, severity and submitted time.
- Actions: Verify, Mark duplicate, Reject, Assign to cleanup.
- Assignment state should show who/which cleanup queue owns the item.
- Include a small impact summary.
- Make clear through labels that this is a restricted coordinator/moderator workspace.

### Prototype interactions to connect

Connect the prototype so a reviewer can tap through this primary path:

1. Welcome → Create account → Verify email → Home.
2. Welcome → Log in → Home.
3. Home → Explore map → Select a marker → Water-body details → Submit a rating.
4. Home or bottom navigation → Report → Add photo → Select location → Review AI suggestion → Submit → Report detail.
5. Home → Drives → Drive detail → Join → Joined confirmation / My drives.
6. Profile → Tier details / Badge collection / Points history.
7. Moderator concept → Report queue → Review report → Assign to cleanup → Updated report status.

Use realistic sample content and believable sample values. The prototype is a UI demonstration; do not pretend that map GPS, image classification, authentication, email verification, database writes or rewards are live unless connected to real services later.

### Content and sample data

Use sample locations around Odisha:
- Puri Beach, Puri
- Chandipur Beach, Balasore
- Bindusagar Lake, Bhubaneswar
- A sample urban lake or riverbank in Bhubaneswar

Use sample report types:
- Plastic bottles and wrappers
- Mixed litter
- Discarded fishing net / fishing gear
- Glass and metal waste
- Organic waste

Use realistic statuses such as Under review, Verified, Assigned, In progress and Resolved. Example member: “Aarav” or another fictional name. Do not use real personal details.

### Output expectations

- Generate a cohesive, high-fidelity Android app design, not a website.
- Keep all screens visually consistent and make the main actions obvious.
- Include useful empty, loading, error, selected, submitted, joined and verified states where relevant.
- Prefer reusable components for buttons, status chips, report cards, map markers, rating cards, tier cards and bottom navigation.
- Make the result suitable for a hackathon presentation and a Flutter developer to reproduce.
- Do not add unrelated features such as chat, social feeds, direct messaging, online shopping or complex organization management.

## 2. Short refinement prompts to use after Stitch generates the first draft

Use these one at a time if the first result needs improvement.

### Refinement A — strengthen visual identity

“Refine the existing Tidewise screens into one coherent ocean-inspired design system. Keep the deep navy, aqua, turquoise and sand palette. Improve typography, spacing, contrast and card hierarchy. Make the design feel like a credible modern environmental app, not a generic admin dashboard. Do not remove any required feature or navigation destination.”

### Refinement B — improve the map and reporting flow

“Improve the Explore map and waste-report flow. Make map pins, selected marker details, filters, photo upload, GPS/manual map selection and AI category confirmation obvious. Ensure the user can complete a report in a few simple steps. Preserve the existing Tidewise design system.”

### Refinement C — improve rewards and gamification

“Polish the Tidewise aquatic tier and badge experience. Make tier progression motivating but mature and uncluttered. Clearly show points earned, progress to the next tier, earned badges and contribution history. Use the exact tier names and thresholds in the brief. Do not make rewards look like gambling or a shopping app.”

### Refinement D — improve usability and presentation

“Review every Tidewise screen for Android mobile usability. Increase tap-target sizes, improve readability, simplify crowded screens, add missing empty/error/success states and ensure navigation is consistent. Keep the prototype focused on the end-to-end hackathon demonstration journey.”

## 3. Prototype review checklist

Before treating the Stitch prototype as ready, confirm:

- [ ] Sign-up asks only for full name, email, age, password and confirm password.
- [ ] Email verification, login, remembered-session and forgot-password states are represented.
- [ ] Public users are not asked to select a role or provide a phone number.
- [ ] Home has a visible report action and map preview.
- [ ] Explore contains map markers, search and useful filters.
- [ ] A report supports photo, GPS or manually selected location, category, AI suggestion and severity.
- [ ] A water-body page supports a 1–5 cleanliness rating and displays the scientific-assessment disclaimer.
- [ ] Members can inspect report status and join a cleanup activity.
- [ ] Profile shows points, aquatic tier, badges and contribution history.
- [ ] Moderator review is visibly separate from ordinary member functions.
- [ ] Future capabilities such as member-created drives and real reward redemption are labelled as coming soon.
- [ ] The full main journey is connected with clickable prototype interactions.
