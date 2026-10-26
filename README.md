# SkillConnect

A full-stack networking platform that helps people discover others with shared skills and interests, build profiles, and grow their professional network.

## Features

- User registration and login
- Profile creation and editing
- Discover people and search members
- Send, accept, and reject connection requests
- View incoming and outgoing connections
- Notifications for connection requests and acceptances
- Unread notification count and mark-as-read functionality

## Tech Stack

**Frontend**

- React
- Vite
- CSS

**Backend**

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT-based authentication

## Project Structure

```text
SkillConnect/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install Node.js and npm. You will also need a MongoDB database, such as MongoDB Atlas.

### 1. Clone the repository

```bash
git clone https://github.com/7281-hub/SkillConnect.git
cd SkillConnect
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside `server/` using `.env.example` as a reference. Fill in your own database connection string, JWT secret, and any other variables required by the application.

Start the backend using the script configured in `server/package.json`, for example:

```bash
npm run dev
```

The current development backend is configured to run at `http://localhost:5000`.

### 3. Set up the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## API Overview

| Method | Endpoint                                  | Purpose                        |
| ------ | ----------------------------------------- | ------------------------------ |
| GET    | `/api/health`                             | Check backend health           |
| POST   | `/api/connections/:userId`                | Send a connection request      |
| GET    | `/api/connections`                        | View connection requests       |
| PATCH  | `/api/connections/:connectionId`          | Accept or reject a request     |
| GET    | `/api/notifications`                      | Fetch notifications            |
| PATCH  | `/api/notifications/:notificationId/read` | Mark a notification as read    |
| PATCH  | `/api/notifications/read-all`             | Mark all notifications as read |

Protected endpoints require a valid authentication token. Consult the backend route files for authentication, user, and profile endpoints.

## Development Workflow

1. Choose a feature or bug to work on.
2. Implement small, focused changes.
3. Run the frontend and backend locally.
4. Test the feature and check for errors.
5. Review changes with `git status` and `git diff`.
6. Commit stable changes with a descriptive message.
7. Push the commit to GitHub.

Example:

```bash
git add .
git commit -m "Describe the feature"
git push
```

## Environment Variables and Security

- Never commit `.env` files or database credentials.
- Keep real secrets out of `README.md` and `.env.example`.
- Use placeholder values in `.env.example`.
- Keep `node_modules/` out of version control.

## Roadmap

- Improve the user dashboard
- Add messaging between connected users
- Improve search and member filtering
- Add further testing and error handling

## Repository

[GitHub — SkillConnect](https://github.com/7281-hub/SkillConnect)

## Project Status

SkillConnect is under active development. Features, API endpoints, and setup instructions may evolve as the project grows.
