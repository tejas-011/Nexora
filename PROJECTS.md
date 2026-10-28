# Project data

Projects are served by the Express API from MongoDB. `projects-data.js` is the seed source: edit its array, then run `npm run seed` to replace the MongoDB project collection. There is no admin login or edit form. Entries marked `isSample: true` are labelled as sample projects; replace them with approved project information before presenting them as completed company work.

Add one object per project to the JavaScript array. Required values are `id`, `name`, `shortDescription`, `description`, one of `category` or `categories`, and `technologies`. Use a unique lowercase hyphenated `id`; categories must be `Web Development`, `Mobile Apps`, `Software Solutions`, `IoT`, or `Other`. Use `categories` as an array when a project belongs to more than one category. Use `isSample: true` to mark example projects; omit a project `status` until its actual status is known. If supplied, status must be `Completed` or `In Progress`.

Optional values are `image` (card and details image), `imageAlt`, `features` (array of strings), `screenshots` (array of `{ "src": "...", "alt": "..." }`), and `links` (array of `{ "label": "...", "url": "https://..." }`). Image paths may be relative to the site or HTTPS URLs. Only add screenshots and project links that are approved for public display.

Example structure with placeholders (replace every bracketed value before publishing):

```js
window.NEXORA_PROJECT_DATA = [
  {
    "id": "[unique-project-id]",
    "isSample": true,
    "name": "[Approved project name]",
    "shortDescription": "[Short public summary]",
    "description": "[Full public project description]",
    "categories": ["Other"],
    "technologies": ["[Technology name]"],
    "image": "images/[approved-project-image].jpg",
    "imageAlt": "[Description of the project image]",
    "features": ["[Approved capability]"],
    "screenshots": [
      {
        "src": "images/[approved-screenshot].jpg",
        "alt": "[Description of screenshot]"
      }
    ],
    "links": [
      {
        "label": "Visit project",
        "url": "https://[approved-project-url]"
      }
    ]
  }
];
```
