# Rep Ledger — Exercise Tracker

A lightweight full-stack exercise tracker for creating athletes, recording training sessions, and reviewing workout history from a clean browser interface.

Built with plain Node.js and browser-native JavaScript—no framework or database required.

## Features

- Create athlete profiles with a username
- Record exercise sessions with:
  - Exercise description
  - Duration in minutes
  - Optional workout date
- View a combined training history for all athletes
- Retrieve user and exercise-log data through a REST-style API
- Filter exercise logs by date range and limit the number of results
- Responsive, mobile-friendly interface
- CORS headers and API responses aligned with the freeCodeCamp Exercise Tracker project
- In-memory data storage for a simple, dependency-free setup

> **Note:** Data is stored in memory and will be cleared whenever the server restarts. This project is currently intended for learning, experimentation, and local use rather than production persistence.

## Tech stack

- **Runtime:** Node.js
- **Backend:** Node.js built-in `http`, `fs`, `path`, `crypto`, and `url` modules
- **Frontend:** HTML, CSS, and vanilla JavaScript
- **Storage:** In-memory `Map`
- **Dependencies:** None

## Getting started

### Prerequisites

- Node.js installed on your machine
- A modern web browser

### Installation

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Dieu-Merci-Ndenga/exercise-tracker.git
cd exercise-tracker
```

No package installation is required because the application uses only Node.js built-in modules.

### Run the application

Start the server in production mode:

```bash
npm start
```

For development, use Node's watch mode so the server restarts when `server.js` changes:

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

To use a different port, set the `PORT` environment variable:

```bash
PORT=8080 npm start
```

On Windows PowerShell:

```powershell
$env:PORT=8080; npm start
```

## How to use

1. Enter a username in **Create athlete** and submit the form.
2. Select the athlete from the **Add a session** form.
3. Enter an exercise description and duration.
4. Optionally choose a date, then submit the session.
5. Review all recorded sessions in **Training history**.

## API reference

The server exposes the following endpoints.

### Create a user

```http
POST /api/users
```

Form-encoded or JSON body:

```json
{
  "username": "alex_chen"
}
```

Example response:

```json
{
  "username": "alex_chen",
  "_id": "generated-user-id"
}
```

### List users

```http
GET /api/users
```

Example response:

```json
[
  {
    "username": "alex_chen",
    "_id": "generated-user-id"
  }
]
```

### Add an exercise

```http
POST /api/users/:userId/exercises
```

Form-encoded or JSON body:

```json
{
  "description": "Morning run",
  "duration": 35,
  "date": "2026-10-13"
}
```

The `date` field is optional. When omitted, the current date is used.

Example response:

```json
{
  "username": "alex_chen",
  "_id": "generated-user-id",
  "description": "Morning run",
  "duration": 35,
  "date": "Tue Oct 13 2026"
}
```

### Get an exercise log

```http
GET /api/users/:userId/logs
```

Optional query parameters:

| Parameter | Description |
| --- | --- |
| `from` | Include exercises on or after this date |
| `to` | Include exercises on or before this date |
| `limit` | Return no more than this many exercises |

Example:

```text
GET /api/users/generated-user-id/logs?from=2026-01-01&to=2026-12-31&limit=10
```

Example response:

```json
{
  "username": "alex_chen",
  "_id": "generated-user-id",
  "count": 1,
  "log": [
    {
      "description": "Morning run",
      "duration": 35,
      "date": "Tue Oct 13 2026"
    }
  ]
}
```

## Project structure

```text
exercise-tracker/
├── public/
│   ├── app.js        # Browser-side API calls and UI behavior
│   ├── index.html    # Application markup
│   └── styles.css    # Responsive interface styling
├── package.json      # Project metadata and npm scripts
├── server.js         # HTTP server, static files, and API routes
└── README.md
```

## Validation and error handling

The API rejects requests when:

- A username is missing
- An exercise description is missing
- Exercise duration is not a positive number
- An exercise date is invalid
- The requested user does not exist
- The requested route cannot be found

The browser interface also escapes exercise descriptions before rendering them in the history list.

## Development notes

This project intentionally keeps the implementation small and dependency-free. Possible next steps include:

- Persisting users and exercises in SQLite or another database
- Adding authentication and per-user access control
- Supporting exercise editing and deletion
- Adding weekly and monthly progress summaries
- Adding automated API and browser tests
- Improving pagination for larger exercise histories

## License

No license has been specified for this repository yet. If you plan to distribute or reuse the project, add a license file that matches your intended usage.

## Author

Created by [Dieu-Merci-Ndenga](https://github.com/Dieu-Merci-Ndenga).
