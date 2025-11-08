import { useState } from "react";
import { storage, db } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

const DoctorRegistration = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate file type and size
  const validateFile = (file) => {
    if (!file) return "Please upload a license file";
    
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, JPEG, JPG, and PNG files are allowed";
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    return null;
  };

  // Validate all form fields
  const validateForm = () => {
    const newErrors = {};

    if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters long";
    }

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (specialization.trim().length < 2) {
      newErrors.specialization = "Please enter your specialization";
    }

    if (licenseNumber.trim().length < 3) {
      newErrors.licenseNumber = "Please enter a valid license number";
    }

    const fileError = validateFile(file);
    if (fileError) {
      newErrors.file = fileError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Clear file error if a file is selected
    if (selectedFile && errors.file) {
      setErrors({ ...errors, file: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const uniqueFileName = `${email}_${timestamp}.${fileExtension}`;
      
      const fileRef = ref(storage, `licenses/${uniqueFileName}`);
      await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(fileRef);

      // Store doctor data in Firestore
      await addDoc(collection(db, "doctors"), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        specialization: specialization.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseURL: fileURL,
        verified: false,
        registeredAt: new Date().toISOString(),
        status: "pending",
      });

      // Note: In production, you should use Firebase Authentication
      // to create the user account with the password
      // For now, password is not stored (security best practice)

      setSuccess(true);
      
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSpecialization("");
      setLicenseNumber("");
      setFile(null);
      setErrors({});

      // Reset file input
      e.target.reset();

    } catch (err) {
      console.error("Registration failed:", err);
      
      // Handle specific Firebase errors
      if (err.code === "storage/unauthorized") {
        setError("Unauthorized file upload. Please check Firebase storage rules.");
      } else if (err.code === "storage/quota-exceeded") {
        setError("Storage quota exceeded. Please contact support.");
      } else if (err.code === "permission-denied") {
        setError("Permission denied. Please check Firestore rules.");
      } else {
        setError("Registration failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Registration</h1>
          <p className="text-gray-600">
            Join our telemedicine platform and start helping patients
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-sm">Your application is pending admin verification. You'll receive an email once approved.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Dr. John Doe"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="doctor@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Min. 8 characters"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.specialization ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Cardiology, Pediatrics"
            />
            {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical License Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.licenseNumber ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your license number"
            />
            {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical License Document <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
              errors.file ? "border-red-500" : "border-gray-300"
            }`}>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {file ? (
                    <span className="font-medium text-blue-600">{file.name}</span>
                  ) : (
                    <>
                      <span className="font-medium text-blue-600 hover:text-blue-500">Upload a file</span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 5MB</p>
              </label>
            </div>
            {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Register as Doctor"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already registered?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
};

export default DoctorRegistration;