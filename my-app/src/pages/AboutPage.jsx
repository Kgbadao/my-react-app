export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">About Our Telemedicine Services</h1>
      <p className="mb-4">
        We connect patients with licensed healthcare professionals remotely — delivering timely, confidential, and accessible care from the comfort of your home.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-semibold">Our Mission</h2>
          <p>To provide quality remote healthcare using secure technology and professional expertise.</p>
        </div>
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-semibold">Trusted Professionals</h2>
          <p>All consultations are handled by board-certified physicians and medical staff.</p>
        </div>
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-semibold">Confidential & Secure</h2>
          <p>HIPAA-compliant, encrypted communication ensures your privacy and peace of mind.</p>
        </div>
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-semibold">Available Anywhere</h2>
          <p>Access care from your phone, tablet, or computer—anywhere, anytime.</p>
        </div>
      </div>
    </div>
  );
}
