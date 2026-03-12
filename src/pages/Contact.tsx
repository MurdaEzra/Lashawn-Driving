import React, { useState, lazy } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const handleChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>

  {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send data to a backend
    console.log('Form submitted:', formData);
    alert("Thank you for your message! We'll get back to you shortly.");
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-gray-800 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-lg">
            Get in touch with us for inquiries, registration, or more
            information about our courses and services.
          </p>
        </div>
      </div>
      {/* Contact Information */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h2 className="mb-6 text-2xl font-semibold text-gray-800">
                  Get In Touch
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <MapPin
                      className="mr-4 mt-1 flex-shrink-0 text-[#2E8B57]"
                      size={24} />
                    
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-gray-800">
                        Our Location
                      </h3>
                      <p className="text-gray-600">
                        Along Eldoret Roadblock — Opposite Khetias Supermarket
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone
                      className="mr-4 mt-1 flex-shrink-0 text-[#2E8B57]"
                      size={24} />
                    
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-gray-800">
                        Phone
                      </h3>
                      <p>
                        <a
                          href="tel:+254117564318"
                          className="text-gray-600 hover:text-[#2E8B57]">
                          
                          +254 117 564 318
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail
                      className="mr-4 mt-1 flex-shrink-0 text-[#2E8B57]"
                      size={24} />
                    
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-gray-800">
                        Email
                      </h3>
                      <p>
                        <a
                          href="mailto:lashawnlimited@gmail.com"
                          className="text-gray-600 hover:text-[#2E8B57]">
                          
                          lashawnlimited@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock
                      className="mr-4 mt-1 flex-shrink-0 text-[#2E8B57]"
                      size={24} />
                    
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-gray-800">
                        Working Hours
                      </h3>
                      <div className="text-gray-600">
                        <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                        <p>Saturday: 9:00 AM - 4:00 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-medium text-gray-800">
                    Follow Us
                  </h3>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-[#2E8B57] hover:text-white"
                      aria-label="Facebook">
                      
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-[#2E8B57] hover:text-white"
                      aria-label="Twitter">
                      
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-[#2E8B57] hover:text-white"
                      aria-label="Instagram">
                      
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5">
                        </rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="mb-6 text-2xl font-semibold text-gray-800">
                  Send Us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1 block text-sm font-medium text-gray-700">
                      
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]" />
                    
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700">
                        
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]" />
                      
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1 block text-sm font-medium text-gray-700">
                        
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]" />
                      
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-1 block text-sm font-medium text-gray-700">
                      
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]">
                      
                      <option value="">Select a subject</option>
                      <option value="driving-inquiry">
                        Driving Course Inquiry
                      </option>
                      <option value="computer-inquiry">
                        Computer Course Inquiry
                      </option>
                      <option value="service-inquiry">Service Inquiry</option>
                      <option value="registration">Registration Inquiry</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1 block text-sm font-medium text-gray-700">
                      
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]">
                    </textarea>
                  </div>
                  <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full">
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Map Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
              Find Us
            </h2>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="aspect-w-16 aspect-h-9 h-96 w-full bg-gray-300">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.656641285244!2d35.2616!3d0.5143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x178101ae37f9f535%3A0xe2db337bf071c994!2sEldoret!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske"
                  width="100%"
                  height="100%"
                  style={{
                    border: 0
                  }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lashawn Location">
                </iframe>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                href="https://www.google.com/maps?q=Eldoret+Roadblock"
                className="px-4 py-2">
                
                View on Google Maps
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>);

}