import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all properties
export const getProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).send('Error fetching properties.');
  }
};

// Get property by ID
export const getPropertiesById = async (req, res) => {
  const { id } = req.params;
  try {
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).send('Error fetching property.');
  }
};

// Add a new property
export const addProperty = async (req, res) => {
  const {
    title,
    description,
    imageUrl,
    length,
    breadth,
    city,
    state,
    pincode,
    price,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    sold,
    userId,
  } = req.body;

  try {
    const property = await prisma.property.create({
      data: {
        title,
        description,
        imageUrl,
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        city,
        state,
        pincode,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        parking: Boolean(parking),
        furnished: Boolean(furnished),
        sold: Boolean(sold),
        user: { connect: { id: userId } },
      },
    });
    res.status(201).json(property);
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).send('Error adding property.');
  }
};

// Update a property
export const updateProperty = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    imageUrl,
    length,
    breadth,
    city,
    state,
    pincode,
    price,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    sold,
  } = req.body;

  try {
    const property = await prisma.property.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        imageUrl,
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        city,
        state,
        pincode,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        parking: Boolean(parking),
        furnished: Boolean(furnished),
        sold: Boolean(sold),
      },
    });
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(404).send('Property not found.');
  }
};

// Delete a property
export const deleteProperty = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.property.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(404).send('Property not found.');
  }
};