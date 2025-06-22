import { Link } from "react-router-dom";
import { Video, Search, MessageCircle, Monitor } from "lucide-react";
import doctorImage from "../assets/doctor-image.png";

function HomePage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-gray-800">
      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between py-20 px-6 md:px-16 max-w-5xl mx-auto gap-12">
        <div className="flex-1 space-y-6 text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 leading-snug font-poppins">
            Welcome to <span className="text-blue-600">TeleMed</span>
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed font-rubik">
            Your health, simplified. Connect with healthcare professionals from the comfort of your home.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/video-call"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium hover:scale-105 transition"
            >
              <Video className="w-5 h-5" /> Start Video Call
            </Link>
            <Link
              to="/chat"
              className="flex items-center gap-2 border border-blue-600 text-blue-700 px-6 py-3 rounded-full font-medium hover:bg-blue-100 hover:scale-105 transition"
            >
              <MessageCircle className="w-5 h-5" /> Message Now
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <img src={doctorImage} alt="Doctor" className="w-72 md:w-80 h-auto rounded-lg shadow-xl" />
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6 md:px-12 bg-blue-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-16 font-poppins">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:scale-[1.02] transition-transform space-y-4 border border-blue-200">
              <Search className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-800 font-rubik">Find a Doctor</h3>
              <p className="text-gray-700">
                Search our extensive network of qualified healthcare providers to find the right specialist for your needs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:scale-[1.02] transition-transform space-y-4 border border-blue-200">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-800 font-rubik">Instant Messaging</h3>
              <p className="text-gray-700">
                Communicate with your doctor securely and conveniently through our real-time messaging platform.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:scale-[1.02] transition-transform space-y-4 border border-blue-200">
              <Monitor className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-800 font-rubik">Video Consultations</h3>
              <p className="text-gray-700">
                Schedule and conduct virtual appointments with healthcare professionals from anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-200 text-blue-800 text-center py-6">
        <p className="font-rubik text-sm tracking-wide">&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
