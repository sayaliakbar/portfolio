import { useState } from "react";
import { motion as Motion } from "framer-motion";
import Button from "./Button";
import axios from "axios";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({
    submitting: false,
    success: null,
    error: null,
  });

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitStatus({ submitting: true, success: null, error: null });

    try {
      const response = await axios.post("/messages", formData);

      if (response.data.success) {
        setSubmitStatus({
          submitting: false,
          success: "Your message has been sent successfully!",
          error: null,
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        throw new Error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      setSubmitStatus({
        submitting: false,
        success: null,
        error:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    }
  };

  // Input animation
  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitStatus.success && (
        <Motion.div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {submitStatus.success}
        </Motion.div>
      )}

      {submitStatus.error && (
        <Motion.div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {submitStatus.error}
        </Motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <Motion.div
            variants={inputVariants}
            initial="blur"
            whileFocus="focus"
          >
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
          </Motion.div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email *
          </label>
          <Motion.div
            variants={inputVariants}
            initial="blur"
            whileFocus="focus"
          >
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
          </Motion.div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Subject *
        </label>
        <Motion.div variants={inputVariants} initial="blur" whileFocus="focus">
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.subject ? "border-red-500" : "border-gray-300"
            }`}
          />
        </Motion.div>
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message *
        </label>
        <Motion.div variants={inputVariants} initial="blur" whileFocus="focus">
          <textarea
            id="message"
            name="message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.message ? "border-red-500" : "border-gray-300"
            }`}
          ></textarea>
        </Motion.div>
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message}</p>
        )}
      </div>

      <div className="text-right">
        <Button
          type="submit"
          variant="primary"
          className="px-8 py-3 cursor-pointer"
          disabled={submitStatus.submitting}
        >
          {submitStatus.submitting ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
