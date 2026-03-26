# ServiceLink
> Your Job, Your Price, Your Choice

A cross-platform web and mobile marketplace connecting customers 
with local service providers such as plumbers, electricians, 
mechanics, tutors, and freelancers.

---

## Group Members
| Name | ID | Role |
|---|---|---|
| Denae Miller | 620149076 | Project Manager, Test Engineer |
| Neeka Morgan | 620154639 | UI Designer, Frontend Developer |
| Javaughn Sherman | 620130006 | Mobile App Developer, Backend Developer |
| Stephan McFarlene | 620149725 | Mobile App Developer, Backend Developer |

---

## Tech Stack
- **Frontend/Mobile** — React Native (iOS & Android)
- **Backend** — Node.js / Express
- **Database** — MySQL
- **Third-party** — Google Maps API, Firebase, Email/SMS API
- **Testing** — Jest, Security Testing

---

## Prerequisites
Make sure you have the following installed before running the project:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [MySQL](https://www.mysql.com/) (v8 or higher)
- [Git](https://git-scm.com/)

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ServiceLink.git
cd ServiceLink
```

### 2. Set up the database
```bash
cd database
mysql -u root -p < schema.sql
```

### 3. Set up the backend
```bash
cd server
npm install
cp .env.example .env
```
Edit the `.env` file with your database credentials and API keys.
```bash
npm start
```

### 4. Set up the frontend
```bash
cd client
npm install
npx expo start
```

---

## Environment Variables
Create a `.env` file in the `/server` folder using `.env.example` as a guide:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=servicelink
GOOGLE_MAPS_API_KEY=yourkey
FIREBASE_KEY=yourkey
JWT_SECRET=yourkey
```

---

## Project Structure
```
ServiceLink/
├── client/            ← React Native mobile app
│   ├── components/
│   ├── screens/
│   └── App.js
├── server/            ← Node.js / Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── index.js
├── database/          ← MySQL schema and seed files
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

---

## Running Tests
```bash
cd server
npm test
```

---

## Course Information
- **Course:** SWEN3920 — Software Engineering Capstone
- **Institution:** University of the West Indies, Mona
- **Supervisor:** Dr. Phillipa Bennett
