import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signup.scss';

function Signup() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default role for new users
  });

  const [errors, setErrors] = useState({}); // State to hold error messages
  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    // First Name Validation
    if (!form.firstName) {
      newErrors.firstName = "First Name is required.";
    }

    // Last Name Validation
    if (!form.lastName) {
      newErrors.lastName = "Last Name is required.";
    }

    // Email Validation
    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid.";
    }

    // Password Validation
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    // Confirm Password Validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required.";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors); // Update errors state
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return; // If validation fails, stop form submission
    }

    try {
      const response = await axios.post('http://localhost:5000/api/signup', form);
      const { token, user } = response.data;
  
      localStorage.setItem("token", token); // Store token
      navigate("/login"); // Redirect to login
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      alert("Signup failed. Please try again.");
    }
  };

  return (
    <>
    <div className="signup-container">
      <h2 className="form-heading" style={{ textAlign: 'center' }}>Create Your Account</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <div>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            required
          />
          {errors.firstName && <span className="error">{errors.firstName}</span>}
        </div>

        <div>
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            required
          />
          {errors.lastName && <span className="error">{errors.lastName}</span>}
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
        </div>

        <p className="form-text">
          Already have an account? <a href="/login">Login</a>
        </p>
        
        <button type="submit">Signup</button>
      </form>
      </div>
    </>
  );
}

export default Signup;
