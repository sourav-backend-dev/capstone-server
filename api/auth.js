import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const signup = async (userData, isAdmin = false) => {
  const { firstName, lastName, email, password } = userData;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Set the role based on isAdmin
  const role = isAdmin ? "admin" : "user";

  // Create the user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role, // Set the user's role
    },
  });

  return user;
};

export const login = async (credentials) => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role, 
  };
};
