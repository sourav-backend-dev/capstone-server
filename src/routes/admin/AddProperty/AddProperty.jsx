import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import './AddProperty.scss';

function AddProperty() {
  const { userId } = useAuth();
  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    imageUrl: '',
    length: 0,
    breadth: 0,
    city: '',
    state: '',
    pincode: '',
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    parking: false,
    furnished: false,
    sold: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    const numericFields = ['length', 'breadth', 'price', 'bedrooms', 'bathrooms'];
    setNewProperty({
      ...newProperty,
      [name]: type === 'checkbox' ? checked : numericFields.includes(name) ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/properties', {
        ...newProperty,
        userId,
      });
      alert('Property added successfully!');
      resetForm();
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to add property.');
    }
  };

  const resetForm = () => {
    setNewProperty({
      title: '',
      description: '',
      imageUrl: '',
      length: 0,
      breadth: 0,
      city: '',
      state: '',
      pincode: '',
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      parking: false,
      furnished: false,
      sold: false,
    });
  };

  return (
    <div className="add-property">
      <h1>Add Property</h1>
      <form onSubmit={handleSubmit}>
        {Object.keys(newProperty).map((key) => (
          <React.Fragment key={key}>
            {typeof newProperty[key] === 'boolean' ? (
              <label>
                <input
                  type="checkbox"
                  name={key}
                  checked={newProperty[key]}
                  onChange={handleInputChange}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ) : (
              <input
                type={typeof newProperty[key] === 'number' ? 'number' : 'text'}
                name={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={newProperty[key]}
                onChange={handleInputChange}
                required={key !== 'imageUrl'} // Make optional if needed
              />
            )}
          </React.Fragment>
        ))}
        <button type="submit">Add Property</button>
      </form>
    </div>
  );
}

export default AddProperty;