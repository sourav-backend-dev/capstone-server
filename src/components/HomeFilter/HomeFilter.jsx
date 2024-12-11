import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PropertyCard from '../../components/PropertyCard/PropertyCard';
import './HomeFilter.scss';

const HomeFilter = ({ allProperties }) => {
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/properties');
        setProperties(response.data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        alert('Failed to fetch properties.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleSearch = async () => {
    // Input validation for numeric fields
    const validMinPrice = minPrice && !isNaN(minPrice) ? minPrice : '';
    const validMaxPrice = maxPrice && !isNaN(maxPrice) ? maxPrice : '';

    try {
      const response = await axios.get('http://localhost:5000/api/properties/filter', {
        params: {
          bedrooms,
          bathrooms,
          state,
          city,
          minPrice: validMinPrice,
          maxPrice: validMaxPrice,
        },
      });

      console.log(response);
      setFilteredProperties(response.data);
    } catch (error) {
      console.error('Error fetching filtered properties:', error);
      alert('Failed to fetch properties.');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = properties.filter(
      (property) =>
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query)
    );
    setFilteredProperties(filtered);
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setSearchQuery(transcript);

      const filtered = properties.filter(
        (property) =>
          property.title.toLowerCase().includes(transcript) ||
          property.description.toLowerCase().includes(transcript) ||
          property.city.toLowerCase().includes(transcript)
      );
      setFilteredProperties(filtered);
    };

    recognition.start();
  };

  return (
    <>
      {allProperties && (
        <div className="search-container">
          <div className="search-bar-wrapper">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-bar"
            />
            <button
              className="voice-button"
              onClick={startVoiceRecognition}
              aria-label="Start voice search"
            >
             <i class="fa fa-microphone"></i>
            </button>
          </div>
        </div>
      )}

      <div className="filter-component">
        <div className="filters">
          {allProperties ? (
            <>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                <option value="">Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
              </select>

              <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                <option value="">Bathrooms</option>
                <option value="1">1 Bathroom</option>
                <option value="2">2 Bathrooms</option>
                <option value="3">3 Bathrooms</option>
              </select>

              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </>
          )}

          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="property-results">
          {filteredProperties.length > 0 && (
            filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HomeFilter;