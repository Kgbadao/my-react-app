import React, { useState } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  Heart,
  Brain,
  Baby,
  Activity,
  Search,
  ChevronRight,
  Star,
  Award,
  MapPin
} from 'lucide-react';

const doctors = [
  { 
    id: 'doc1', 
    name: 'Dr. Sarah Smith', 
    specialty: 'General Practice',
    rating: 4.9,
    experience: '15 years',
    location: 'New York, NY',
    avatar: 'SS',
    color: 'from-blue-400 to-blue-600',
    icon: Stethoscope
  },
  { 
    id: 'doc2', 
    name: 'Dr. Michael Johnson', 
    specialty: 'Cardiology',
    rating: 4.8,
    experience: '12 years',
    location: 'Los Angeles, CA',
    avatar: 'MJ',
    color: 'from-red-400 to-red-600',
    icon: Heart
  },
  { 
    id: 'doc3', 
    name: 'Dr. Emily Lee', 
    specialty: 'Pediatrics',
    rating: 5.0,
    experience: '10 years',
    location: 'Chicago, IL',
    avatar: 'EL',
    color: 'from-pink-400 to-pink-600',
    icon: Baby
  },
  { 
    id: 'doc4', 
    name: 'Dr. James Wilson', 
    specialty: 'Mental Health',
    rating: 4.7,
    experience: '18 years',
    location: 'Boston, MA',
    avatar: 'JW',
    color: 'from-purple-400 to-purple-600',
    icon: Brain
  },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

const AppointmentForm = () => {
  const [step, setStep] = useState(1); // Multi-step form
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [userId] = useState('user123'); // replace with real logged-in user ID later
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDoctorSelect = (doctor) => {
    setFormDoctorId(doctor.id);
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formDate || !formTime || !formDoctorId) {
      setMessage('Please complete all steps');
      return;
    }

    const appointmentData = {
      date: formDate,
      time: formTime,
      doctorId: formDoctorId,
      patientId: userId,
      notes: notes,
    };

    try {
      setLoading(true);
      setMessage('');

      // Check for conflict before booking
      const checkRes = await axios.get('http://localhost:5000/api/appointments/check', {
        params: {
          date: formDate,
          time: formTime,
          doctorId: formDoctorId,
        },
      });

      if (checkRes.data.exists) {
        setMessage('This time slot is already booked. Please choose another.');
        return;
      }

      await axios.post('http://localhost:5000/api/appointments', appointmentData);

      setMessage('success');
      // Reset form after 3 seconds
      setTimeout(() => {
        setStep(1);
        setFormDate('');
        setFormTime('');
        setFormDoctorId('');
        setSelectedDoctor(null);
        setNotes('');
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Error creating appointment');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Success Screen
  if (message === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Appointment Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your appointment with <strong>{selectedDoctor?.name}</strong> has been successfully booked.
          </p>
          <div className="bg-indigo-50 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-center gap-2 text-indigo-700 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">{new Date(formDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-indigo-700">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{formTime}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Book Your Appointment
          </h1>
          <p className="text-xl text-gray-600">
            Connect with top healthcare professionals in minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="hidden sm:block font-medium text-gray-700">Choose Doctor</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-3 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="hidden sm:block font-medium text-gray-700">Select Time</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-3 ${step >= 3 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="hidden sm:block font-medium text-gray-700">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Choose Doctor */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredDoctors.map((doctor) => {
                const DoctorIcon = doctor.icon;
                return (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${doctor.color} rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                        {doctor.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-1 group-hover:text-indigo-600 transition">
                          {doctor.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <DoctorIcon className="w-4 h-4" />
                          <span className="text-sm">{doctor.specialty}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-gray-700">{doctor.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>{doctor.experience}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{doctor.location}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && selectedDoctor && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${selectedDoctor.color} rounded-xl flex items-center justify-center text-white font-bold`}>
                    {selectedDoctor.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedDoctor.name}</h3>
                    <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Change Doctor
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    min={getMinDate()}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormTime(time)}
                        className={`py-2 px-3 rounded-lg border-2 transition font-medium text-sm ${
                          formTime === time
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => formDate && formTime && setStep(3)}
                disabled={!formDate || !formTime}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedDoctor && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Review Your Appointment</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl">
                  <User className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Healthcare Provider</p>
                    <p className="font-semibold text-gray-800">{selectedDoctor.name}</p>
                    <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(formDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-xl">
                  <Clock className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="font-semibold text-gray-800">{formTime}</p>
                  </div>
                </div>

                {notes && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <Activity className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Notes</p>
                      <p className="text-gray-800">{notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {message && message !== 'success' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{message}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AppointmentForm;