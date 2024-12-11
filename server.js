import express from 'express';
import { login, signup } from './api/auth.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { getProperties, addProperty, updateProperty, deleteProperty, getPropertiesById } from './api/properties.js';
import jwt from "jsonwebtoken";

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  const payload = { user: { id: user.id, role: user.role } }; // Include user ID and role
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" }); // Token expires in 1 day
  return token;
};

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Prisma Client
const prisma = new PrismaClient();

// Authentication Middleware to check JWT Token
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Get the token from Authorization header

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode JWT token
    req.user = decoded.user; // Attach user data to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

app.post('/api/login/google', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    // Check if the user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName: given_name,
          lastName: family_name,
          googleId,
          role: 'user', // Default role
        },
      });
    }

    const jwtToken = generateToken(user);

    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ error: 'Invalid Google token' });
  }
});


app.get('/api/properties/filter', async (req, res) => {
  const { bedrooms, bathrooms, state, city, minPrice, maxPrice } = req.query;

  console.log('Filter Query:', req.query); // Debugging log for query params

  try {
    // Prepare filter conditions
    const whereConditions = {};

    if (bedrooms) whereConditions.bedrooms = parseInt(bedrooms);
    if (bathrooms) whereConditions.bathrooms = parseInt(bathrooms);
    if (state) whereConditions.state = state;
    if (city) whereConditions.city = city;
    if (minPrice) whereConditions.price = { gte: parseFloat(minPrice) };
    if (maxPrice) whereConditions.price = { ...whereConditions.price, lte: parseFloat(maxPrice) };

    console.log("Prisma Filter Conditions:", whereConditions);

    // Fetch filtered properties
    const properties = await prisma.property.findMany({
      where: whereConditions,
    });

    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch filtered properties', details: error.message });
  }
});

// Stripe Checkout Session Creation
app.post('/api/create-checkout-session', authMiddleware, async (req, res) => {
  const { plan, payment_method_id } = req.body;
  let priceId;

  switch (plan) {
    case 'Basic':
      priceId = 'price_1KXYBgFFSZV6bCeC0Gbs5t6w'; // Replace with actual Stripe Price ID for Basic Plan
      break;
    case 'Premium':
      priceId = 'price_1KXYFgFFSZV6bCeCwzF7KMt6'; // Replace with actual Stripe Price ID for Premium Plan
      break;
    case 'Ultimate':
      priceId = 'price_1KXYFgFFSZV6bCeCwzF7KMt6'; // Replace with actual Stripe Price ID for Ultimate Plan
      break;
    default:
      return res.status(400).send({ error: 'Invalid plan' });
  }

  try {
    // Create a Checkout session with the selected plan and price
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId, // Dynamically use plan-based price
        quantity: 1,
      }],
      payment_intent_data: {
        payment_method: payment_method_id,
      },
      mode: 'subscription',
      success_url: 'http://localhost:3000/success', // Replace with your success page URL
      cancel_url: 'http://localhost:3000/cancel', // Replace with your cancel page URL
    });

    res.status(200).send({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const user = await signup(req.body);
    const token = generateToken(user); // Generate JWT token

    res.status(201).json({ token, user }); // Send token and user data
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const user = await login(req.body); // Use the existing login logic
    const token = generateToken(user); // Generate JWT token

    res.status(200).json({ token, user }); // Send token and user data
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});


// Get User Profile (Protected route)
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }, // Use user ID from decoded token
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update User Profile (Protected route)
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id }, // Use user ID from decoded token
      data: {
        firstName,
        lastName,
        email,
        password, // Optionally hash the password if it's updated
      },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get All Users Route
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create New User Route
app.post('/api/users', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: { firstName, lastName, email, password, role },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete User Route
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
});

// Properties Routes
app.get('/api/properties', getProperties);
app.post('/api/properties', addProperty);
app.put('/api/properties/:id', updateProperty);
app.delete('/api/properties/:id', deleteProperty);
app.get('/api/properties/:id', getPropertiesById);

// Contact Us Form Submission Endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newContact = await prisma.contact.create({
      data: {
        name,
        email,
        message,
      },
    });

    res.status(201).json({ success: true, data: newContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to save contact form submission.' });
  }
});

app.get('/api/admin/messages', async (req, res) => {
  try {
    const messages = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
// API to create a new appointment
app.post("/api/appointments", async (req, res) => {
  const { title, start, end, userName, userMessage } = req.body;
  try {
    const appointment = await prisma.appointment.create({
      data: { title, start: new Date(start), end: new Date(end), userName, userMessage },
    });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// API to fetch all appointments
app.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany();
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
