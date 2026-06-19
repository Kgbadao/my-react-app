CopyTeleMed — Telemedicine Web Platform

A full-stack telemedicine platform connecting patients with healthcare providers through video consultations, secure messaging, and appointment scheduling. Built solo as a complete, working product — not a prototype.

Live demo: [link]
Demo video: [link]

What It Does

TeleMed gives patients a complete path from finding a doctor to having a consultation:


Patient dashboard — view upcoming and completed appointments at a glance, with quick actions to book, message, or join a call
Doctor discovery — browse by specialty (General Practice, Cardiology, Pediatrics, Mental Health) with ratings, experience, and location
3-step booking flow — choose doctor → select date/time → review and confirm, with a clean confirmation screen at the end
Real-time secure messaging — chat directly with your provider before or after a consultation
Video consultations — peer-to-peer video calls built on WebRTC


Why the Video Call Works the Way It Does

The video consultation screen uses a simple invite-ID system, similar to the link-sharing pattern in tools like Google Classroom or Google Meet: each user gets a shareable ID, and entering the other person's ID connects the call. This was a deliberate choice for usability — it avoids account-matching complexity and is a pattern most users already understand from other tools they use daily.

Tech Stack


Frontend: React, JavaScript (ES6+), HTML5, CSS3
Backend: Node.js, Express.js
Real-time communication: WebRTC (PeerJS), Socket.io
Database & Auth: Firebase (Firestore, Authentication)
Deployment: Vercel (frontend), Render (backend)


Status

This is a fully functional product with all core flows working end-to-end: authentication, booking, dashboard, messaging, and video calls. Doctor and patient data shown in the demo are seeded for demonstration purposes.

Roadmap (not yet built):

Quick Start:
git clone https://github.com/Kgbadao/my-react-app
cd my-react-app
npm install
Create a .env file with your Firebase config:
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_PROJECT_ID=your_id
Last step:
npm run dev for frontend
npm start for backend




Payment/billing integration
Prescription management
Automated integration test suite
