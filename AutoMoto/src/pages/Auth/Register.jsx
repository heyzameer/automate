import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Store, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In real app, call API
    console.log('Registering:', formData);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <Car className="text-white h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Start your showroom
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join 500+ car dealerships across the country
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <div className="mt-1 relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Motors"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unique Slug</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  automoto.ai/
                </span>
                <input
                  type="text"
                  required
                  placeholder="royal-motors"
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Create Account
                <ArrowRight className="ml-2" size={16} />
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-600">Already have an account?</span>
            <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
