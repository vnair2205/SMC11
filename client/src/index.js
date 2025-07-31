// client/src/index.js
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // THIS LINE IS CRUCIAL - IT INITIALIZES THE TRANSLATION SYSTEM
import axios from 'axios'; // Import axios

// A simple loader component to show while translations are loading
const loadingMarkup = (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h3>Loading...</h3>
  </div>
);

// Configure Axios Interceptor for handling 401 Unauthorized responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is an HTTP 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      // ADD THIS NEW CONSOLE.ERROR MESSAGE
      console.error(
        `Authentication Error (401): Session expired or invalid token. ` +
        `Request to URL: ${error.config.url} failed. Logging out...` // This logs the URL that received the 401
      );
      localStorage.removeItem('token'); // Clear the invalid token
      // Redirect to login page. Using window.location.href to force a full page reload
      // which ensures all React state and router history are reset.
      window.location.href = '/login'; 
    }
    return Promise.reject(error); // Reject the promise with the error
  }
);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense fallback={loadingMarkup}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Suspense>
);