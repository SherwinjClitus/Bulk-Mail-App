# Bulk Mail App

A full-stack web app for sending one message to multiple email addresses. Upload an Excel spreadsheet containing email addresses, enter your message, and send it to the valid addresses found in column A.

[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS- styling-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)

## Live Demo

- **Frontend:** [Open the deployed app](<add Vercel URL>)
- **Backend:** [https://bulk-mail-app-oxks.onrender.com](https://bulk-mail-app-oxks.onrender.com)

> The frontend URL is a placeholder until the deployed Vercel URL is added. The free Render service may sleep after roughly 15 minutes of inactivity, so the first request can take about 50 seconds.

## Screenshots

_Add screenshots of the application here._

## Features

- Compose a message and upload an `.xlsx` or `.xls` file containing email addresses in column A.
- Read spreadsheets in the browser with SheetJS; trim entries, remove blanks and duplicates, and keep only valid email formats.
- Display the number of valid addresses and invalid or duplicate entries skipped.
- Validate the message and spreadsheet before sending, with live message errors and a disabled send button while the form is invalid or a request is in progress.
- Send the message to valid addresses one at a time through the backend.
- Show the server result in an alert and clear the form after a successful send.
- Animated matrix-style background using the `LetterGlitch` component.

## How It Works

1. Enter a message and select an Excel file with email addresses in column A.
2. The frontend reads the file in the browser, cleans and validates the addresses, removes duplicates, and displays the recipient count.
3. When you send, the frontend posts `{ message, emailList }` to `${VITE_API_URL}/sendmail`.
4. The backend validates the request and reads the sender Gmail address and App Password from the MongoDB `bulkmail` collection (`user` and `pass` fields).
5. Nodemailer sends the message to each address with the subject `Bulk Mail App Test Msg` and the stored Gmail address as sender.
6. The backend returns `{ success: true }` or `{ success: false, error }`; the frontend displays the result.

## Validation

| Input | Validation |
| --- | --- |
| Message | Required; whitespace-only messages count as empty; maximum 5,000 characters. |
| File | Required; `.xlsx` or `.xls` only; maximum 2 MB; must be a readable Excel file with at least one sheet. |
| Email addresses | Read from column A, converted to text, trimmed, with blanks and duplicates removed; only valid email formats are kept. |
| Send action | Enabled only when the message is valid, at least one email is loaded, and no request is in progress. The send handler re-checks the data and uses `try/catch/finally` to reset the sending state. |

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, shadcn/ui components (Button, Textarea, Input, Field), Axios, SheetJS (`xlsx`), `LetterGlitch` animated background |
| Backend | Node.js, Express, Mongoose, Nodemailer (Gmail service), CORS, dotenv, express-rate-limit |
| Database | MongoDB Atlas (`passkey` database, `bulkmail` collection) |
| Hosting | Vercel (frontend), Render free tier (backend) |

## Repository Structure

```text
Bulk-Mail-App/
├── backend/
│   ├── index.js
│   ├── package.json
│   └── .gitignore
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── TextareaButton.jsx
        │   ├── LetterGlitch.jsx
        │   └── ui/
        │       ├── button
        │       ├── field
        │       ├── input
        │       ├── label
        │       ├── separator
        │       └── textarea
        └── lib/
            └── utils.js
```

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB Atlas connection string
- A project Gmail account with 2-Step Verification and a Gmail App Password

### 1. Configure and run the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```dotenv
MONGO_URL=<MongoDB Atlas connection string>
```

In the MongoDB `passkey` database, add a document to the `bulkmail` collection with these fields:

| Field | Value |
| --- | --- |
| `user` | The project Gmail address |
| `pass` | The Gmail App Password (16 letters, no spaces) |

Start the backend:

```bash
npm start
```

The server uses `process.env.PORT` and defaults to port `5000`.

### 2. Configure and run the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000
```

Do not add a trailing slash to `VITE_API_URL`. Start the Vite development server:

```bash
npm run dev
```

## Backend API

### `POST /sendmail`

Submit a JSON body containing a message and an array of email addresses:

```json
{
  "message": "Your message here",
  "emailList": ["recipient@example.com"]
}
```

| Status | Response / error |
| --- | --- |
| `200` | `{ "success": true }` |
| `400` | `Message is required.` or `Email list is required.` |
| `500` | `Mail credentials not found.` or `Failed to send emails.` |

The endpoint is limited to 5 requests per 15 minutes per IP. The server uses async/await and a request-level `try/catch` to return a response for each request.

## Deployment

### Backend — Render

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment variable:** `MONGO_URL`
- Render's proxy is trusted for rate limiting.

### Frontend — Vercel

- **Root Directory:** `frontend`
- **Framework preset:** Vite
- **Environment variable:** `VITE_API_URL` set to the deployed Render backend URL, without a trailing slash.
- Redeploy after changing the environment variable.

## Security Notes and Limitations

- Keep the MongoDB connection string in environment variables. `.env` is listed in `.gitignore`; never commit secrets.
- Gmail credentials are loaded from the MongoDB `bulkmail` collection rather than hard-coded or stored in environment variables. Use a separate project Gmail account with 2-Step Verification and an App Password, not a personal account.
- The Atlas IP access list is configured to allow `0.0.0.0/0` so Render can connect. Database access still requires a username and password; consider restricting network access where deployment requirements allow.
- CORS is currently open, `/sendmail` has no login protection, and there is no per-request recipient-list size limit. These are known limitations.
- Render's free service sleeps after around 15 minutes of inactivity; its first request after sleeping can take about 50 seconds.

## Future Improvements

- Replace browser alerts with toast notifications.
- Add a send-progress counter, such as “Sent 3 of 20”.
- Limit each request to 100 email addresses.
- Restrict CORS to the frontend domain.
- Allow a custom subject.
- Add login protection.

## Author

Made with ❤️ by Sherwin
