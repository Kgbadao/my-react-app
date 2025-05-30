// /src/pages/ServicesPage.jsx

import React from 'react';

function ServicesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Our Services</h1>
      <p className="text-lg mb-6">
        At TeleMed, we bring healthcare directly to your fingertips. Our platform is designed to cater to your health needs securely and conveniently.
      </p>
      <div className="space-y-6">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Secure Video Consultations</h2>
          <p>
            Connect with qualified healthcare professionals through encrypted video calls at your convenience.
          </p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Real-Time Messaging</h2>
          <p>
            Send and receive messages instantly with your doctor to discuss your health concerns or follow up on consultations.
          </p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Appointment Scheduling</h2>
          <p>
            Book, reschedule, or cancel appointments easily using our online system, ensuring that you meet your healthcare needs on time.
          </p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Electronic Medical Records</h2>
          <p>
            Access your medical history and consultation records securely at any time through your personalized dashboard.
          </p>
        </div>
      </div>
      <p className="mt-8 text-gray-600">
        Our goal is to provide a comprehensive and accessible healthcare experience. Explore our services and see how TeleMed can help you.
      </p>
    </div>
  );
}

export default ServicesPage;
