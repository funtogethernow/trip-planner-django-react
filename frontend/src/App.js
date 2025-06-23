import React, { useState } from 'react';
import './App.css';

function App() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const response = await fetch('/api/plan/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, start_date: startDate, end_date: endDate })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trip Planner</h1>
        <form onSubmit={handleSubmit} className="trip-form">
          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            required
          />
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Planning...' : 'Plan Trip'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {plan && (
          <div className="trip-result">
            <h2>Trip Plan for {plan.destination}</h2>
            <p><b>Coordinates:</b> {plan.coordinates.lat}, {plan.coordinates.lon}</p>
            <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{plan.plan}</pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
