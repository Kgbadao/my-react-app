// /src/pages/ServicesPage.jsx

import React from 'react';
import { VideoIcon, MessageSquareTextIcon, CalendarCheckIcon, FileTextIcon } from 'lucide-react';

function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-blue-800 mb-4">Our Services</h1>
        <p className="text-lg text-gray-600 mb-8">
          At <span className="font-semibold text-blue-700">TeleMed</span>, we bring healthcare directly to your fingertips. Our platform is designed to cater to your health needs securely and conveniently.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition border-l-4 border-blue-500">
            <div className="flex items-center space-x-4 mb-3">
              <VideoIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Secure Video Consultations</h2>
            </div>
            <p className="text-gray-600">
              Connect with qualified healthcare professionals through encrypted video calls at your convenience.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition border-l-4 border-green-500">
            <div className="flex items-center space-x-4 mb-3">
              <MessageSquareTextIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Real-Time Messaging</h2>
            </div>
            <p className="text-gray-600">
              Send and receive messages instantly with your doctor to discuss your health concerns or follow up on consultations.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition border-l-4 border-yellow-500">
            <div className="flex items-center space-x-4 mb-3">
              <CalendarCheckIcon className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-800">Appointment Scheduling</h2>
            </div>
            <p className="text-gray-600">
              Book, reschedule, or cancel appointments easily using our online system, ensuring that you meet your healthcare needs on time.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition border-l-4 border-purple-500">
            <div className="flex items-center space-x-4 mb-3">
              <FileTextIcon className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-800">Electronic Medical Records</h2>
            </div>
            <p className="text-gray-600">
              Access your medical history and consultation records securely at any time through your personalized dashboard.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-gray-500 text-sm">
          Our goal is to provide a comprehensive and accessible healthcare experience. Explore our services and see how TeleMed can help you.
        </p>
      </div>
    </div>
  );
}

export default ServicesPage;
