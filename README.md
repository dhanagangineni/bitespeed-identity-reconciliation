# Bitespeed Identity Reconciliation API

## Overview

This project implements an Identity Reconciliation service for Bitespeed. The goal is to consolidate customer contact information across multiple purchases when users may use different email addresses or phone numbers. The service intelligently links related contact records and maintains a primary-secondary relationship between them.

The API exposes a single `/identify` endpoint that accepts contact details and returns a unified contact response.

---

## Live Endpoint

POST https://bitespeed-identity-reconciliation-nmqm.onrender.com/identify

---

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL (Neon)
- Render (Deployment)

---

## Problem Approach

Customers may place orders using different combinations of email addresses and phone numbers. To handle this, the system:

- Searches existing contacts by matching email or phone number.
- If no matching records are found, creates a new primary contact.
- If matching records exist, determines the oldest contact as the primary.
- Converts any newer primary contacts into secondary contacts if necessary.
- Creates a new secondary contact when new information is introduced.
- Returns a consolidated response containing all related emails, phone numbers, and secondary contact IDs.

The oldest contact is always preserved as the primary contact to maintain consistency.

---

## Request Format

At least one of `email` or `phoneNumber` must be provided.

Example:

{
  "email": "example@test.com",
  "phoneNumber": "123456"
}

---

## Response Format

{
  "contact": {
    "primaryContactId": 1,
    "emails": ["example@test.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}

---

## How to Run Locally

1. Clone the repository  
2. Install dependencies:

   npm install

3. Create a `.env` file with your database connection:

   DATABASE_URL="your_postgres_connection_string"

4. Push Prisma schema:

   npx prisma db push

5. Run the application:

   Development:
   npm run dev

   Production:
   npm run build
   npm start

---

## Key Design Decisions

- Used a relational schema to maintain clear links between contacts.
- Ensured the oldest contact remains primary to avoid identity inconsistencies.
- Prevented duplicate emails and phone numbers in the response.
- Structured the project with separation of routes, controllers, and database logic for clarity.
- Deployed the service publicly to simulate a production-ready backend system.

---

## Author

Dhanalakshmi Gangineni
