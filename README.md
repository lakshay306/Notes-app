# NoteSpace

A full-stack notes management application built with React, Node.js, Express and MongoDB.

## Features
- User registration and login with JWT authentication
- Create, edit and delete notes
- Public and private notes
- Favorites, archive, trash and restore
- Search notes
- Responsive interface

## Tech Stack
React, Vite, CSS, Node.js, Express, MongoDB, Mongoose, bcryptjs and JSON Web Tokens.

## Run locally

### Backend
```bash
cd backend
npm install
```
Create `backend/.env` using `.env.example` as a template and set your MongoDB URI and a strong JWT secret.
```bash
npm run dev
```

### Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

Never commit `.env` or real credentials to GitHub.
