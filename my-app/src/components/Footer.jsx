import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-[#1c2f54] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300">© {new Date().getFullYear()} TeleMed. All rights reserved.</p>
        <Link
          to="/doctorregistration"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 transition"
        >
          Register as Doctor
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
