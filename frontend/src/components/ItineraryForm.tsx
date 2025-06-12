// import React, { useState } from 'react';
// import axios from 'axios';
// import { ItineraryRequest } from '../types';

// const ItineraryForm: React.FC = () => {
//   const [formData, setFormData] = useState<ItineraryRequest>({
//     destination: '',
//     days: 1,
//   });
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     setResult(null);

//     try {
//       const response = await axios.post('https://ai-travel-itinerary-planner.onrender.com/api/itinerary/', formData);
//       setResult(response.data.result);
//     } catch (err) {
//       setError('Failed to generate itinerary. Please try again.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto">
//       <div className="card mb-8">
//         <h2 className="text-2xl font-bold text-primary mb-6">Create New Itinerary</h2>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label htmlFor="destination" className="block text-sm font-medium text-gray-300 mb-2">
//               Destination
//             </label>
//             <input
//               type="text"
//               id="destination"
//               className="input w-full"
//               value={formData.destination}
//               onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
//               required
//               placeholder="Enter your destination"
//             />
//           </div>
//           <div>
//             <label htmlFor="days" className="block text-sm font-medium text-gray-300 mb-2">
//               Number of Days
//             </label>
//             <input
//               type="number"
//               id="days"
//               className="input w-full"
//               value={formData.days}
//               onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
//               min="1"
//               required
//             />
//           </div>
//           <button
//             type="submit"
//             className="btn btn-primary w-full"
//             disabled={loading}
//           >
//             {loading ? 'Generating...' : 'Generate Itinerary'}
//           </button>
//         </form>
//       </div>

//       {error && (
//         <div className="card bg-red-900/20 border border-red-500 text-red-200 mb-8">
//           {error}
//         </div>
//       )}

//       {result && (
//         <div className="card">
//           <h3 className="text-xl font-semibold text-primary mb-4">Your Itinerary</h3>
//           <div className="prose prose-invert max-w-none">
//             {result.split('\n').map((line, index) => (
//               <p key={index} className="mb-4">{line}</p>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ItineraryForm; 
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ItineraryRequest } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

const ItineraryForm: React.FC = () => {
  const [formData, setFormData] = useState<ItineraryRequest>({
    destination: '',
    days: 1,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('https://ai-travel-itinerary-planner.onrender.com/api/itinerary/', formData);
      setResult(response.data.result);
    } catch (err) {
      setError('Failed to generate itinerary. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!resultRef.current) return;
    
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: '#1a202c'
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