# ServiceLink
> Your Job, Your Price, Your Choice

A cross-platform mobile marketplace connecting customers with local service providers such as plumbers, electricians, mechanics, tutors, and freelancers.

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

- **Mobile App** — React Native (iOS & Android)
- **Backend** — Node.js / Express
- **Database** — PostgreSQL
- **Authentication** — JWT (24hr expiry) + bcrypt (10 salt rounds)
- **Third-party** — Google Maps Geocoding API
- **Testing** — Jest, Postman, OWASP ZAP

---

## Key Features

- **Location-based search** — Listings are ranked by real-world distance from the
  customer using the **Haversine distance formula** (computed in SQL with
  `6371 * acos(...)`), returning a `distance_km` value for each result.
- **Google Geocoding** — Address text (e.g. "Spanish Town, Jamaica") is converted
  into latitude/longitude coordinates via the Google Geocoding API, both when a
  listing is created/updated and through a dedicated geocode endpoint.
- **New-provider fairness boost** — Search ranking gives providers who joined
  within the last 30 days a visibility boost (shown ahead of established
  providers at equal relevance), helping newcomers gain their first customers.
- **Fairness analysis (Jain's Index)** — The admin dashboard runs a simulation of
  many randomized location searches and reports **Jain's Fairness Index** for the
  ranking both with and without the new-provider boost, quantifying how evenly
  provider exposure is distributed.

---

## Prerequisites

Make sure you have the following installed before running the project:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v13 or higher)
- [Git](https://git-scm.com/)
- [React Native development environment](https://reactnative.dev/docs/set-up-your-environment) (Android Studio and/or Xcode)
- [Postman](https://www.postman.com/) (for API testing)

---

## Project Structure

```
ServiceLink/
├── backend/                        ← Node.js / Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               ← PostgreSQL connection
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── availabilityController.js
│   │   │   ├── bookingController.js
│   │   │   ├── listingController.js
│   │   │   ├── messageController.js
│   │   │   ├── notificationController.js
│   │   │   ├── profileController.js
│   │   │   └── reviewController.js
│   │   ├── middleware/
│   │   │   ├── auth.js             ← JWT verification
│   │   │   └── rbac.js             ← Role based access control
│   │   ├── models/
│   │   │   ├── Availability.js
│   │   │   ├── Booking.js
│   │   │   ├── Listing.js
│   │   │   ├── Message.js
│   │   │   ├── Notification.js
│   │   │   ├── Profile.js
│   │   │   ├── Review.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── availability.js
│   │   │   ├── bookings.js
│   │   │   ├── listings.js
│   │   │   ├── messages.js
│   │   │   ├── notifications.js
│   │   │   ├── profile.js
│   │   │   └── reviews.js
│   │   ├── utils/
│   │   │   └── geocode.js          ← Google Geocoding helper
│   │   └── app.js                  ← Express entry point
│   ├── .env                        ← Environment variables (not uploaded)
│   ├── .gitignore
│   └── package.json
└── myapp/                          ← React Native mobile app (React Native CLI)
```

---

## Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/javsherman/ServiceLink.git
cd ServiceLink/backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Create your .env file**

Create a file called `.env` inside the `backend` folder:
```
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/servicelink
JWT_SECRET=your_secret_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**4. Set up the database**

Open psql and run:
```sql
CREATE DATABASE servicelink;
\c servicelink

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('customer', 'provider', 'admin')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  phone VARCHAR(20),
  location VARCHAR(255),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE availability (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE (provider_id, day_of_week)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('booking_confirmed', 'booking_rejected', 'booking_cancelled', 'new_message', 'new_review', 'new_booking')) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**5. Run the server**
```bash
npm run dev
```

Server will start at `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register a new user |
| POST | /api/auth/login | Public | Login and get JWT token |

### Profile
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/profile/me | All | Get own profile |
| PUT | /api/profile/me | All | Update own profile |
| GET | /api/profile/:id | All | Get profile by user id |

### Bookings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/bookings | Customer | Create a booking |
| GET | /api/bookings/my | Customer, Provider | Get my bookings |
| GET | /api/bookings/:id | Customer, Provider | Get booking by id |
| PUT | /api/bookings/:id/confirm | Provider | Confirm a booking |
| PUT | /api/bookings/:id/reject | Provider | Reject a booking |
| PUT | /api/bookings/:id/cancel | Customer | Cancel a booking |
| PUT | /api/bookings/:id/complete | Provider | Mark a booking as completed |
| PUT | /api/bookings/:id/reschedule | Customer | Reschedule a booking |

### Listings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/listings | All | Search listings (supports lat/lng distance ranking) |
| GET | /api/listings/my | Provider | Get own listings |
| GET | /api/listings/geocode | All | Convert an address into coordinates |
| GET | /api/listings/:id | All | Get listing by id |
| POST | /api/listings | Provider | Create a listing |
| PUT | /api/listings/:id | Provider | Update a listing |
| DELETE | /api/listings/:id | Provider | Delete a listing |

### Availability
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/availability | Provider | Set/update availability for a day |
| GET | /api/availability/my | Provider | Get own availability |
| PUT | /api/availability/toggle | Provider | Toggle availability for a day |
| DELETE | /api/availability/:day | Provider | Remove availability for a day |
| GET | /api/availability/:providerId | All | Get a provider's availability |

### Messages
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/messages | All | Send a message |
| GET | /api/messages/conversations | All | Get all conversations |
| GET | /api/messages/poll | All | Poll for new messages |
| GET | /api/messages/:userId | All | Get conversation with user |

### Reviews
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/reviews | Customer | Submit a review |
| GET | /api/reviews/provider/:id | All | Get provider reviews |
| PUT | /api/reviews/:id | Customer | Edit own review |
| DELETE | /api/reviews/:id | Customer | Delete own review |

### Notifications
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/notifications | All | Get all notifications |
| GET | /api/notifications/unread | All | Get unread notifications |
| PUT | /api/notifications/:id/read | All | Mark one as read |
| PUT | /api/notifications/read/all | All | Mark all as read |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/admin/users | Admin | Get all users |
| DELETE | /api/admin/users/:id | Admin | Delete a user |
| GET | /api/admin/bookings | Admin | Get all bookings |
| GET | /api/admin/listings | Admin | Get all listings |
| DELETE | /api/admin/listings/:id | Admin | Delete a listing |
| GET | /api/admin/analytics | Admin | Get platform analytics |
| GET | /api/admin/listings/pending | Admin | Get listings awaiting approval |
| PUT | /api/admin/listings/:id/approve | Admin | Approve a pending listing |
| PUT | /api/admin/listings/:id/decline | Admin | Decline a pending listing |
| GET | /api/admin/fairness | Admin | Run fairness simulation (Jain's Index) |

---

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- Sessions managed with **JWT** (24 hour expiry)
- Role based access control — **Customer / Provider / Admin**
- All data in transit encrypted with **TLS 1.3 (HTTPS)**
- SQL injection prevention via **parameterized queries**
- Input validation on all endpoints

---

## Course Information

- **Course:** SWEN3920 — Software Engineering Capstone
- **Institution:** University of the West Indies, Mona
- **Supervisor:** Dr. Phillipa Bennett
