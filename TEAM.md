# Managing team profiles

The team page loads profiles from `team-data.js`. This site is static HTML, CSS, and JavaScript; it has no backend, database, authentication, or admin panel. Update the `window.NEXORA_TEAM_DATA` array with approved information to add, edit, or remove profiles. Because the data is loaded as a local script, the team page works when opening `index.html` directly from the file system as well as when hosted.

The ten included names and biographies are fictional sample content, not actual employees. Every profile is marked with `"isSample": true`, and sample profiles are labelled on their cards and profile details. Replace the sample data with approved company information before presenting the page as a real staff directory. Change `isSample` to `false` only after the profile has been replaced with approved information.

Each profile object uses:

- `id`: unique lowercase identifier with hyphens
- `isSample`: `true` for clearly labelled fictional sample profiles; `false` for approved real profiles
- `name`, `role`, `department`, `shortBio`, `bio`
- `skills`: an array of skill or expertise labels
- `avatar`: short fallback text shown when there is no photo
- `profilePhoto`: `null` or a local image path / HTTPS image URL
- `linkedin`: blank or an approved HTTPS profile URL
- `email`: blank or an approved contact email

Department values are `Management`, `Development`, `Design`, `QA & Testing`, `Quality Assurance`, `Infrastructure`, and `Database & Infrastructure`. The `QA & Testing` filter includes `Quality Assurance`; the `Infrastructure` filter includes both infrastructure department labels. Leave unavailable LinkedIn and email fields blank. Only use real team photos, bios, skills, and profile/contact links that the relevant person has approved for public display. Remove a profile by removing its object from the JSON array.
