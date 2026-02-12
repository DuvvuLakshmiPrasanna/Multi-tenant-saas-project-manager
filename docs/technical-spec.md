# Technical Specification

## Project Structure
```
root/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/ (or db access)
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── migrations/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   └── Dockerfile
├── docs/
├── docker-compose.yml
└── README.md
```

## Development Setup
1. **Install Docker Desktop**.
2. **Clone Repository**.
3. **Environment Variables**: See `.env.example`.
4. **Run**: `docker-compose up -d`.

## Testing
- **Backend**: Jest / Supertest (Optional for submission, verify via Postman).
- **Frontend**: Manual verification via UI.
