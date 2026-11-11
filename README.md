# Bulk Mail App

A full-stack web app for sending one message to many email addresses. Enter a subject and a message, upload an Excel spreadsheet of addresses, and send. Every send is saved to MongoDB, and a History side panel shows past sends.

[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-styling-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Brevo](https://img.shields.io/badge/Brevo-email_API-0B996E)](https://www.brevo.com/)

## Live Demo

- **Frontend:** [https://bulk-mail-app-swart-nine.vercel.app/](https://bulk-mail-app-swart-nine.vercel.app/)
- **Backend:** [https://bulk-mail-app-oxks.onrender.com](https://bulk-mail-app-oxks.onrender.com)

The backend runs on Render's free tier, which sleeps after about 15 minutes of inactivity. The first request after that can take around 50 seconds.

## Screenshots

Add screenshots of the application here.

## Features

- Enter a subject and a message, and upload an `.xlsx` or `.xls` file with email addresses in column A.
- Read the spreadsheet in the browser with SheetJS: trim entries, remove blanks and duplicates, and keep only valid email formats.
- Show how many valid addresses were found and how many invalid or duplicate entries were skipped.
- Validate the subject, message and file before sending, with live error messages and a send button that stays disabled until the form is valid.
- Send the message to each address through the Brevo transactional email API.
- Save one record per send in MongoDB with the subject, message, recipients, counts and status (`success`, `partial` or `failed`).
- View past sends in a **History** side panel built with the shadcn/ui Sheet component.
- Keep recipient addresses private: the history API never returns them.
- Animated matrix-style background using the `LetterGlitch` component.

## How It Works

1. Enter a subject and a message, then select an Excel file with email addresses in column A.
2. The frontend reads the file in the browser, cleans and validates the addresses, removes duplicates, and shows the recipient count.
3. When you send, the frontend posts `{ subject, message, emailList }` to `${VITE_API_URL}/sendmail`.
4. The backend validates the request, then sends one email per address through Brevo's HTTPS API (`https://api.brevo.com/v3/smtp/email`) using Node's built-in `fetch`.
5. A failed address does not stop the loop. The backend counts successes and failures and decides the status: `success` (all sent), `partial` (some sent) or `failed` (none sent).
6. The backend saves a `MailRecord` document in MongoDB, then replies with the result and counts.
7. Opening the History panel calls `GET /history`, which returns the latest records without recipient addresses or message text.

### Why Brevo's API instead of SMTP

The app first used Nodemailer over Gmail SMTP. It worked locally, but Render's free tier blocks outbound SMTP ports, so sending on the live site failed with `ETIMEDOUT` after two minutes. Brevo's API is a normal HTTPS request, which Render allows.

## Validation

| Input | Validation |
| --- | --- |
| Subject | Required; whitespace-only counts as empty; maximum 150 characters. |
| Message | Required; whitespace-only counts as empty; maximum 5,000 characters. |
| File | Required; `.xlsx` or `.xls` only; maximum 2 MB; must be a readable Excel file with at least one sheet. |
| Email addresses | Read from column A, converted to text, trimmed, with blanks and duplicates removed; only valid email formats are kept. |
| Send action | Enabled only when the subject and message are valid, at least one email is loaded, and no request is in progress. The send handler re-checks the data and uses `try/catch/finally` to reset the sending state. |

The backend repeats the subject, message and email-list checks, because the frontend can be bypassed.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, shadcn/ui (Button, Textarea, Input, Field, Sheet), Axios, SheetJS (`xlsx`), `LetterGlitch` animated background |
| Backend | Node.js, Express, Mongoose, Brevo transactional email API (via `fetch`), CORS, dotenv, express-rate-limit |
| Database | MongoDB Atlas (`passkey` database, `mailrecords` collection) |
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
        │   ├── HistorySheet.jsx
        │   ├── LetterGlitch.jsx
        │   └── ui/
        │       ├── button
        │       ├── field
        │       ├── input
        │       ├── label
        │       ├── separator
        │       ├── sheet
        │       └── textarea
        └── lib/
            └── utils.js
```

## Getting Started

### Prerequisites

- Node.js 18 or newer (the backend uses the built-in `fetch`) and npm
- A MongoDB Atlas connection string
- A free [Brevo](https://www.brevo.com/) account with a verified sender address and an API key

### Brevo setup

1. Create a Brevo account.
2. Add a sender address and confirm it from the email Brevo sends, until it shows as verified.
3. Create an API key with the restricted permission **Transactional email: All** and nothing else.

Mail sent from a free address such as Gmail can land in recipients' spam folders. A sender on a domain you own and authenticate improves delivery.

### 1. Configure and run the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```dotenv
MONGO_URL=<MongoDB Atlas connection string>
BREVO_API_KEY=<Brevo API key>
SENDER_EMAIL=<verified sender address>
```

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

Send one message to a list of addresses.

```json
{
  "subject": "Your subject here",
  "message": "Your message here",
  "emailList": ["recipient@example.com"]
}
```

| Status | Response |
| --- | --- |
| `200` | `{ "success": true, "status": "success" or "partial", "sentCount": 2, "failedCount": 0 }` |
| `400` | `Subject is required.`, `Subject is too long.`, `Message is required.` or `Email list is required.` |
| `429` | `Too many requests. Try again later.` |
| `500` | `Mail service is not configured.` or `Failed to send emails.` (no address was sent) |

The endpoint is limited to 5 requests per 15 minutes per IP address.

### `GET /history`

Returns the latest 50 send records, newest first. Only these fields are returned: `subject`, `status`, `totalCount`, `sentCount`, `failedCount` and `createdAt`. Recipient addresses, message text and error details are never included.

```json
{
  "success": true,
  "records": [
    {
      "_id": "...",
      "subject": "Hello",
      "status": "success",
      "totalCount": 2,
      "sentCount": 2,
      "failedCount": 0,
      "createdAt": "2026-11-11T04:57:13.017Z"
    }
  ]
}
```

## Data Model

Each send is stored as one `MailRecord` document in the `mailrecords` collection.

| Field | Description |
| --- | --- |
| `subject` | The subject entered by the user |
| `message` | The message body |
| `recipients` | The list of addresses (stored, never returned by the API) |
| `totalCount` | Number of addresses in the request |
| `sentCount` | Number of addresses sent successfully |
| `failedCount` | Number of addresses that failed |
| `status` | `success`, `partial` or `failed` |
| `errorMessage` | The last error, empty when everything was sent |
| `createdAt`, `updatedAt` | Added automatically by Mongoose |

## Deployment

### Backend — Render

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment variables:** `MONGO_URL`, `BREVO_API_KEY`, `SENDER_EMAIL`
- The app trusts Render's proxy so the rate limiter sees real client addresses.

### Frontend — Vercel

- **Root Directory:** `frontend`
- **Framework preset:** Vite
- **Environment variable:** `VITE_API_URL` set to the deployed Render backend URL, without a trailing slash.
- Redeploy after changing the environment variable.

## Security Notes and Limitations

- Keep the MongoDB connection string and the Brevo API key in environment variables. `.env` is listed in `.gitignore`; never commit secrets.
- The Brevo key is restricted to transactional email. Brevo expires API keys after 90 days without use, so create a new key if sending suddenly fails after a long pause.
- The Atlas IP access list allows `0.0.0.0/0` so Render can connect. Database access still requires a username and password; restrict network access where your deployment allows.
- `GET /history` is public, but it returns only subjects, dates, statuses and counts.
- CORS is currently open, `/sendmail` has no login protection, and there is no limit on the number of recipients in one request. These are known limitations.
- Use a separate project sender address rather than a personal one. Free-provider senders can be marked as spam.

## Future Improvements

- Replace browser alerts with toast notifications, including a clear message for partial sends.
- Add a send-progress counter, such as "Sent 3 of 20".
- Limit each request to 100 email addresses.
- Restrict CORS to the frontend domain.
- Add admin login to protect sending and history.
- Authenticate a custom sending domain for better delivery.

## Author

Made with ❤️ by Sherwin
