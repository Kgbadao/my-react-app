import React from 'react';
import { 
  Heart, 
  Shield, 
  Globe, 
  Award,
  Users,
  Clock,
  CheckCircle,
  Stethoscope,
  Video,
  Lock,
  TrendingUp,
  Star
} from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'End-to-end encrypted communications ensure your medical information stays completely private and secure.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Users,
      title: 'Expert Doctors',
      description: 'Connect with board-certified physicians and licensed healthcare professionals across all specialties.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Access quality healthcare anytime, anywhere. No more waiting rooms or scheduling conflicts.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Whether at home, work, or traveling, get the care you need from any device with internet access.',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Patients Served', icon: Users },
    { number: '500+', label: 'Healthcare Providers', icon: Stethoscope },
    { number: '98%', label: 'Satisfaction Rate', icon: Star },
    { number: '24/7', label: 'Support Available', icon: Clock }
  ];

  const values = [
    {
      title: 'Patient-Centered Care',
      description: 'Your health and wellbeing are at the center of everything we do. We listen, understand, and provide personalized treatment plans.',
      icon: Heart
    },
    {
      title: 'Quality & Excellence',
      description: 'We maintain the highest standards of medical care through continuous training and adherence to best practices.',
      icon: Award
    },
    {
      title: 'Innovation & Technology',
      description: 'Leveraging cutting-edge telemedicine technology to make healthcare more accessible and efficient.',
      icon: TrendingUp
    },
    {
      title: 'Privacy & Security',
      description: 'Your medical data is protected with bank-level encryption and strict compliance with healthcare regulations.',
      icon: Lock
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Create Your Account',
      description: 'Sign up in minutes with secure verification',
      icon: Users
    },
    {
      step: '2',
      title: 'Choose Your Doctor',
      description: 'Browse specialists and select the right fit',
      icon: Stethoscope
    },
    {
      step: '3',
      title: 'Schedule or Connect',
      description: 'Book an appointment or get instant consultation',
      icon: Video
    },
    {
      step: '4',
      title: 'Receive Care',
      description: 'Get diagnosis, prescriptions, and follow-ups',
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block p-3 bg-white bg-opacity-20 rounded-2xl mb-6">
            <Heart className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Healthcare Without Boundaries
          </h1>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing healthcare by connecting patients with licensed medical professionals through secure, convenient, and accessible telemedicine services.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 -mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center transform hover:scale-105 transition">
                <stat.icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-800 mb-1">{stat.number}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To make quality healthcare accessible to everyone, everywhere, by combining medical expertise with innovative technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-md hover:shadow-xl transition border border-gray-100">
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Getting started is simple and takes just minutes</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-indigo-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex gap-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl hover:shadow-lg transition">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of patients who trust TeleMed for their healthcare needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-lg hover:shadow-xl transform hover:scale-105">
              Get Started Today
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-indigo-600 transition">
              Contact Us
            </button>
          </div>
        </div>
      </section>
      {/* Trust Indicators */}
      <section className="py-12 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">HIPAA Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">ISO Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Verified Doctors</span>
          
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}