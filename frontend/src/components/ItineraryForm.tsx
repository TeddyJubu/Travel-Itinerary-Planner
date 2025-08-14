import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ItineraryRequest } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import Map from './Map';

const ItineraryForm: React.FC = () => {
  const { currentUser, getIdToken } = useAuth();
  const [formData, setFormData] = useState<ItineraryRequest>({
    destination: '',
    days: 1,
    user_email: currentUser?.email || '', // Keep for local state, but won't send to API
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  /**
   * Handle form submission for creating a new itinerary
   * 
   * This function:
   * 1. Validates user authentication
   * 2. Gets Firebase ID token for API authentication
   * 3. Sends request with token in Authorization header
   * 4. Removes user_email from request body (handled by backend via token)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      setError('You must be logged in to create an itinerary');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get Firebase ID token for authentication
      const idToken = await getIdToken();
      if (!idToken) {
        setError('Authentication failed. Please try logging in again.');
        setLoading(false);
        return;
      }

      // Prepare request data without user_email (handled by backend via token)
      const requestData = {
        destination: formData.destination,
        days: formData.days
        // user_email removed - backend gets this from Firebase token
      };

      // Make API request with Firebase token in Authorization header
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/itinerary/`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for AI generation
        }
      );
      
      setResult(response.data.result);
    } catch (err: any) {
      console.error('Error creating itinerary:', err);
      
      // Handle different types of errors
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.error || 'Invalid request data.';
        setError(errorMessage);
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The AI is taking longer than usual. Please try again.');
      } else {
        setError('Failed to generate itinerary. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!resultRef.current) {
      return;
    }
    
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: '#1a202c',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Ensure text colors are preserved
          const elements = clonedDoc.getElementsByClassName('prose');
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i] as HTMLElement;
            element.style.color = '#ffffff';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`itinerary-${formData.destination}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Create New Itinerary</h2>
          {result && (
            <button
              onClick={exportToPDF}
              disabled={pdfLoading}
              className="text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded flex items-center transition-colors disabled:opacity-50"
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-300 mb-2">
                Destination
              </label>
              <input
                type="text"
                id="destination"
                className="input w-full"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
                placeholder="Where do you want to go?"
              />
            </div>
            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-300 mb-2">
                Number of Days
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="days"
                  className="input w-full"
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="30"
                  required
                />
                <div className="absolute right-3 top-3 text-gray-400">
                  {formData.days === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full py-3 flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Itinerary...
              </>
            ) : (
              'Generate Itinerary'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="card bg-red-900/20 border border-red-500 text-red-200 mb-8">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="card" ref={resultRef}>
          <h3 className="text-xl font-semibold text-primary mb-4">Your Itinerary for {formData.destination}</h3>
          
          {/* Map Display */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-3">📍 Locations Map</h4>
            <Map
              itinerary={{
                id: 0,
                destination: formData.destination,
                days: formData.days,
                result: result,
                created_at: new Date().toISOString(),
                user_email: formData.user_email
              }}
              height="400px"
              zoom={10}
              showControls={true}
            />
          </div>
          
          <div className="prose prose-invert max-w-none bg-dark rounded-lg p-5 border border-dark-light">
            <ReactMarkdown
              components={{
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-semibold text-white mb-3 mt-4 flex items-center">
                    <span className="bg-primary/10 text-primary text-sm w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      {props.children?.toString().match(/Day (\d+)/)?.[1] || ''}
                    </span>
                    {props.children}
                  </h4>
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-none space-y-2 ml-4">{props.children}</ul>
                ),
                li: ({ node, ...props }) => (
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{props.children}</span>
                  </li>
                ),
                p: ({ node, ...props }) => (
                  <p className="mb-4 text-gray-300">{props.children}</p>
                )
              }}
            >
              {result}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryForm;