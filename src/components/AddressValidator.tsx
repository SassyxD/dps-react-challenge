import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { PlzApiResponse, PlzEntry } from '../types/plz';
import './AddressValidator.css';

export function AddressValidator() {
  const [locality, setLocality] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isDropdown, setIsDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const debouncedLocality = useDebounce(locality, 1000);
  const debouncedPostalCode = useDebounce(postalCode, 1000);

  // Lookup by locality
  useEffect(() => {
    if (!debouncedLocality) {
      setPostalCodeOptions([]);
      setIsDropdown(false);
      return;
    }

    const fetchByLocality = async () => {
      try {
        setError('');
        setSuccess(false);
        setIsLoading(true);
        const response = await fetch(
          `https://openplzapi.org/de/Localities?name=${encodeURIComponent(debouncedLocality)}`
        );
        const data: PlzApiResponse = await response.json();

        if (data && data.length > 0) {
          const postalCodes = [...new Set(data.map((doc) => doc.postalCode))];
          
          if (postalCodes.length === 1) {
            setPostalCode(postalCodes[0]);
            setIsDropdown(false);
            setPostalCodeOptions([]);
            setSuccess(true);
          } else {
            setPostalCodeOptions(postalCodes);
            setIsDropdown(true);
            setPostalCode(''); // Clear postal code when switching to dropdown
          }
        } else {
          setError('No results found for this locality');
          setPostalCodeOptions([]);
          setIsDropdown(false);
        }
      } catch (err) {
        setError('Failed to fetch locality data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchByLocality();
  }, [debouncedLocality]);

  // Lookup by postal code
  useEffect(() => {
    if (!debouncedPostalCode || isDropdown) {
      return;
    }

    const fetchByPostalCode = async () => {
      try {
        setError('');
        setSuccess(false);
        setIsLoading(true);
        const response = await fetch(
          `https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(debouncedPostalCode)}`
        );
        const data: PlzApiResponse = await response.json();

        if (data && data.length > 0) {
          // Use the first locality name if multiple exist
          setLocality(data[0].name);
          setSuccess(true);
        } else {
          setError('Invalid postal code');
        }
      } catch (err) {
        setError('Failed to fetch postal code data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchByPostalCode();
  }, [debouncedPostalCode, isDropdown]);

  const handlePostalCodeSelect = (selectedCode: string) => {
    setPostalCode(selectedCode);
    setIsDropdown(false);
    setPostalCodeOptions([]);
    setSuccess(true);
  };

  return (
    <div className="address-validator">
      <h2>German Address Validator</h2>
      <div className="form-group">
        <label htmlFor="locality">Locality (City/Town)</label>
        <input
          id="locality"
          type="text"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="e.g., Berlin, München"
        />
      </div>

      <div className="form-group">
        <label htmlFor="postalCode">Postal Code (PLZ)</label>
        {isDropdown ? (
          <select
            id="postalCode"
            value={postalCode}
            onChange={(e) => handlePostalCodeSelect(e.target.value)}
          >
            <option value="">Select a postal code</option>
            {postalCodeOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="e.g., 10115"
          />
        )}
      </div>

      {isLoading && <div className="loading-message">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {success && !error && <div className="success-message">✓ Valid address found!</div>}
    </div>
  );
}
