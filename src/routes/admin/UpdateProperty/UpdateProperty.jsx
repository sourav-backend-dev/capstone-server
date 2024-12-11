import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './UpdateProperty.scss';

function UpdateProperty() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState({
    title: '',
    description: '',
    imageUrl: '',
    length: '',
    breadth: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        console.error('Error fetching property:', error);
        alert('Failed to fetch property details.');
      }
    };

    fetchProperty();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/properties/${id}`, {
        ...property,
        userId,
      });
      alert('Property updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Failed to update property.');
    }
  };

  return (
    <div className="update-property">
      <h1>Update Property</h1>
      <form onSubmit={handleSubmit}>
        {Object.keys(property)
          .filter((key) => !['createdAt', 'updatedAt', 'userId'].includes(key)) // Exclude these fields
          .map((key) => (
            <input
              key={key}
              type={key === 'length' || key === 'breadth' ? 'number' : 'text'}
              name={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={property[key]}
              onChange={handleInputChange}
              required
              disabled={key === 'id'} // Disable the 'id' field
            />
          ))}
        <button type="submit" className="update-btn">Update Property</button>
      </form>
    </div>
  );
}

export default UpdateProperty;
