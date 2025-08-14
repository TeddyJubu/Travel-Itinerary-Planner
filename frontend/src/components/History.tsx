import React, { useState, useEffect, useCallback } from 'react';
import { Itinerary } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import Map from './Map';

const History: React.FC = () => {
  const { currentUser, getIdToken } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);
  const [modalItinerary, setModalItinerary] = useState<Itinerary | null>(null);
  const [mapItinerary, setMapItinerary] = useState<Itinerary | null>(null);

  /**
   * Fetch user's itinerary history using Firebase authentication
   * 
   * This function:
   * 1. Validates user authentication
   * 2. Gets Firebase ID token for API authentication
   * 3. Sends request with token in Authorization header
   * 4. Removes user_email query parameter (handled by backend via token)
   */
  const fetchItineraries = useCallback(async () => {
    if (!currentUser?.email) {
      setError('You must be logged in to view your history');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Fetching itineraries...
      
      // Get Firebase ID token for authentication
      const idToken = await getIdToken();
      if (!idToken) {
        setError('Authentication failed. Please try logging in again.');
        setLoading(false);
        return;
      }

      // Make API request with Firebase token in Authorization header
      // Remove user_email query parameter - backend gets this from Firebase token
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/history/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          // Add timeout for the request
          signal: AbortSignal.timeout(30000) // 30 second timeout
        }
      );
      
      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to fetch itineraries: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      // Successfully fetched itineraries
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array');
      }
      
      setItineraries(data);
    } catch (err) {
      console.error('Error fetching itineraries:', err);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred while fetching itineraries');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, getIdToken]);

  useEffect(() => {
    fetchItineraries();
  }, [currentUser, fetchItineraries]);

  // Add a retry mechanism
  const retryFetch = () => {
    setLoading(true);
    setError(null);
    fetchItineraries();
  };

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalItinerary(null);
      }
    };

    if (modalItinerary) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [modalItinerary]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseItinerary = (text: string) => {
    if (!text || text.trim() === '') {
      // No text to parse
      return [];
    }
    
    try {
      // Split the text into days
      const daySections = text.split(/\*\*Day (\d+):/);
      const days: any[] = [];
      
      // If no day sections found, try to parse as a single day
      if (daySections.length === 1) {
        const lines = text.split('\n').filter(line => line.trim());
        
        // Extract and format the heading
        let heading = '';
        const headingIndex = lines.findIndex(line => line.includes('**'));
        if (headingIndex !== -1) {
          heading = lines[headingIndex].replace(/\*\*/g, '').trim();
          lines.splice(headingIndex, 1); // Remove the heading line
        }
        
        const activities = lines
          .filter(line => {
            const trimmedLine = line.trim();
            return (
              (trimmedLine.includes('AM') || trimmedLine.includes('PM')) ||
              (trimmedLine.startsWith('*') && !trimmedLine.includes('Cost:') && !trimmedLine.includes('Transportation:'))
            );
          })
          .map(line => {
            const timeMatch = line.match(/(\d{1,2}:\d{2} (?:AM|PM)(?:\s*-\s*\d{1,2}:\d{2} (?:AM|PM))?)/);
            const time = timeMatch ? timeMatch[1] : '';
            
            // Extract description and cost
            let description = line.replace(time, '').trim();
            const costMatch = description.match(/Cost: ₹([\d,]+)/);
            const cost = costMatch ? `₹${costMatch[1]}` : null;
            
            // Clean up description but preserve markdown
            description = description
              .replace(/Cost: ₹[\d,]+/, '')
              .trim();
            
            return {
              time,
              description,
              cost
            };
          })
          .filter(activity => activity.description && activity.description.length > 0);

        // Get description (text before first activity)
        const descriptionLines = lines.filter(line => 
          !line.includes('AM') && 
          !line.includes('PM') && 
          !line.trim().startsWith('*') &&
          !line.includes('Cost:') &&
          !line.includes('Transportation:') &&
          !line.includes('Estimated Costs:') &&
          !line.includes('Local Customs:') &&
          !line.includes('Safety Tips:')
        );
        const description = descriptionLines.join('\n').trim();

        days.push({
          day: 1,
          heading,
          description,
          activities
        });
      } else {
        // Process sections in pairs: [empty, dayNumber, content, dayNumber, content, ...]
        for (let i = 1; i < daySections.length; i += 2) {
          const dayNumber = parseInt(daySections[i]);
          const section = daySections[i + 1];
          
          if (!section || !section.trim()) {
            continue;
          }
          
          // Split the section into lines and filter out empty lines
          const lines = section.split('\n').filter(line => line.trim());
          
          // Extract and format the heading
          let heading = '';
          const headingIndex = lines.findIndex(line => line.includes('**'));
          if (headingIndex !== -1) {
            heading = lines[headingIndex].replace(/\*\*/g, '').trim();
            lines.splice(headingIndex, 1); // Remove the heading line
          }
          
          // Extract day description (text before the first activity)
          const descriptionLines = lines.filter(line => 
            !line.includes('AM') && 
            !line.includes('PM') && 
            !line.trim().startsWith('*') &&
            !line.includes('Cost:') &&
            !line.includes('Transportation:') &&
            !line.includes('Estimated Costs:') &&
            !line.includes('Local Customs:') &&
            !line.includes('Safety Tips:')
          );
          const description = descriptionLines.join('\n').trim();
          
          // Extract activities
          const activities = lines
            .filter(line => {
              const trimmedLine = line.trim();
              return (
                (trimmedLine.includes('AM') || trimmedLine.includes('PM')) ||
                (trimmedLine.startsWith('*') && !trimmedLine.includes('Cost:') && !trimmedLine.includes('Transportation:'))
              );
            })
            .map(line => {
              const timeMatch = line.match(/(\d{1,2}:\d{2} (?:AM|PM)(?:\s*-\s*\d{1,2}:\d{2} (?:AM|PM))?)/);
              const time = timeMatch ? timeMatch[1] : '';
              
              // Extract description and cost
              let description = line.replace(time, '').trim();
              const costMatch = description.match(/Cost: ₹([\d,]+)/);
              const cost = costMatch ? `₹${costMatch[1]}` : null;
              
              // Clean up description but preserve markdown
              description = description
                .replace(/Cost: ₹[\d,]+/, '')
                .trim();
              
              return {
                time,
                description,
                cost
              };
            })
            .filter(activity => activity.description && activity.description.length > 0);
          
          days.push({
            day: dayNumber,
            heading,
            description,
            activities
          });
        }
      }
      
      return days;
    } catch (error) {
      console.error('Error parsing itinerary:', error);
      return [];
    }
  };

  const exportToPDF = async (itinerary: Itinerary, id: number) => {
    setPdfLoading(id);
    try {
      const element = document.getElementById(`itinerary-card-${id}`);
      if (!element) {
          return;
        }
      
      const canvas = await html2canvas(element, {
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
      
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        const pages = Math.ceil(pdfHeight / pdf.internal.pageSize.getHeight());
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        for (let i = 0; i < pages; i++) {
          if (i > 0) {
          pdf.addPage();
        }
          pdf.addImage(
            imgData, 
            'PNG', 
            0, 
            -i * pageHeight, 
            pdfWidth, 
            pdfHeight
          );
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`itinerary-${itinerary.destination}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setPdfLoading(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedItinerary(expandedItinerary === id ? null : id);
  };

  const openModal = (itinerary: Itinerary) => {
    setModalItinerary(itinerary);
  };

  const closeModal = () => {
    setModalItinerary(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
          <div className="text-gray-300 mt-4 text-lg">Loading your adventures...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 p-8 rounded-xl border border-red-500/50 max-w-md backdrop-blur-sm">
          <div className="text-red-300 font-bold text-lg flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Oops! Something went wrong
          </div>
          <div className="text-red-200 mt-3">{error}</div>
          <button 
            onClick={retryFetch}
            className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="bg-gradient-to-br from-dark-lighter to-dark rounded-xl border border-dark-light p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl text-gray-300 font-semibold">Ready for your first adventure?</h3>
        <p className="text-gray-500 mt-3 max-w-md mx-auto">Your travel plans and memories will appear here once you start creating itineraries</p>
      </div>
    );
  }

  const renderItineraryDetails = (itinerary: Itinerary, isModal: boolean = false) => {
    const parsedItinerary = itinerary.result ? parseItinerary(itinerary.result) : [];
    
    return (
      <div className="space-y-6">
        {parsedItinerary.length > 0 ? (
          parsedItinerary.map((day) => (
            <div key={day.day} className="bg-dark/50 rounded-lg p-5 border border-dark-light/50">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  {day.day}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Day {day.day}
                </h3>
              </div>
              
              {day.heading && (
                <h2 className="text-2xl font-bold text-white mb-4">{day.heading}</h2>
              )}
              
              {day.description && (
                <div className="mb-4 p-3 bg-dark-light/30 rounded-lg">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{props.children}</p>
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside space-y-2 text-gray-300">{props.children}</ul>
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-gray-300">{props.children}</li>
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="text-white font-semibold">{props.children}</strong>
                      ),
                      em: ({ node, ...props }) => (
                        <em className="text-gray-300 italic">{props.children}</em>
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 className="text-2xl font-bold text-white mb-4">{props.children}</h1>
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-bold text-white mb-3">{props.children}</h2>
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-bold text-white mb-2">{props.children}</h3>
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 className="text-base font-bold text-white mb-2">{props.children}</h4>
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-gray-300 my-4">{props.children}</blockquote>
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-dark-light px-2 py-1 rounded text-primary font-mono text-sm">{props.children}</code>
                      ),
                      pre: ({ node, ...props }) => (
                        <pre className="bg-dark-light p-4 rounded-lg overflow-x-auto my-4">{props.children}</pre>
                      )
                    }}
                  >
                    {day.description}
                  </ReactMarkdown>
                </div>
              )}
              
              <div className="space-y-4">
                {day.activities.length > 0 ? (
                  day.activities.map((activity: any, index: number) => (
                    <div key={index} className="group">
                      <div className="flex items-start gap-4 p-3 rounded-lg bg-dark-light/50 hover:bg-dark-light transition-colors">
                        {activity.time && (
                          <div className="flex-shrink-0 min-w-[60px]">
                            <span className="text-primary font-medium text-sm bg-primary/10 px-2 py-1 rounded">
                              {activity.time}
                            </span>
                          </div>
                        )}
                        <div className="flex-grow">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{props.children}</p>
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc list-inside space-y-2 text-gray-200">{props.children}</ul>
                              ),
                              li: ({ node, ...props }) => (
                                <li className="text-gray-200">{props.children}</li>
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="text-white font-semibold">{props.children}</strong>
                              ),
                              em: ({ node, ...props }) => (
                                <em className="text-gray-200 italic">{props.children}</em>
                              ),
                              h1: ({ node, ...props }) => (
                                <h1 className="text-2xl font-bold text-white mb-4">{props.children}</h1>
                              ),
                              h2: ({ node, ...props }) => (
                                <h2 className="text-xl font-bold text-white mb-3">{props.children}</h2>
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 className="text-lg font-bold text-white mb-2">{props.children}</h3>
                              ),
                              h4: ({ node, ...props }) => (
                                <h4 className="text-base font-bold text-white mb-2">{props.children}</h4>
                              ),
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-4 border-primary pl-4 italic text-gray-300 my-4">{props.children}</blockquote>
                              ),
                              code: ({ node, ...props }) => (
                                <code className="bg-dark-light px-2 py-1 rounded text-primary font-mono text-sm">{props.children}</code>
                              ),
                              pre: ({ node, ...props }) => (
                                <pre className="bg-dark-light p-4 rounded-lg overflow-x-auto my-4">{props.children}</pre>
                              )
                            }}
                          >
                            {activity.description}
                          </ReactMarkdown>
                          {activity.cost && (
                            <div className="mt-2 flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="text-green-400 text-sm font-medium">{activity.cost}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">No activities planned for this day</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-8">No detailed itinerary available</div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Travel History
            </h1>
            <p className="text-gray-400 mt-2">Your collection of amazing journeys</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{itineraries.length}</div>
            <div className="text-sm text-gray-400">Adventures</div>
          </div>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((itinerary) => {
            const parsedItinerary = itinerary.result ? parseItinerary(itinerary.result) : [];
            const isExpanded = expandedItinerary === itinerary.id;
            const isPdfLoading = pdfLoading === itinerary.id;
            
            // Successfully parsed itinerary
            
            return (
              <div
                key={itinerary.id}
                id={`itinerary-card-${itinerary.id}`}
                className="bg-gradient-to-br from-dark-lighter to-dark rounded-xl border border-dark-light overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
              >
                {/* Card Header */}
                <div className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 border-b border-dark-light">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2 line-clamp-1">
                        {itinerary.destination}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/20 text-primary text-sm px-3 py-1 rounded-full font-medium">
                          {itinerary.days} {itinerary.days === 1 ? 'day' : 'days'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDate(itinerary.created_at)}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleExpand(itinerary.id)}
                      className="ml-4 p-2 rounded-lg bg-dark-light hover:bg-primary/20 text-gray-400 hover:text-primary transition-all duration-200"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Quick Preview */}
                  {!isExpanded && parsedItinerary.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-400 mb-2">Preview</div>
                      {parsedItinerary.slice(0, 2).map((day, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium mr-3">
                            {day.day}
                          </div>
                          <div className="text-gray-300 truncate">
                            {day.activities.length > 0 
                              ? `${day.activities.length} activities planned`
                              : 'Activities scheduled'
                            }
                          </div>
                        </div>
                      ))}
                      {parsedItinerary.length > 2 && (
                        <div className="text-xs text-gray-500 ml-9">
                          +{parsedItinerary.length - 2} more days...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compact Details View */}
                  {isExpanded && renderItineraryDetails(itinerary)}
                </div>
                
                {/* Card Actions */}
                <div className="bg-dark-light/50 px-6 py-4 flex justify-between items-center border-t border-dark-light">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleExpand(itinerary.id)}
                      className="text-gray-300 hover:text-white text-sm font-medium flex items-center transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Collapse
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Preview
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => openModal(itinerary)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center transition-colors ml-4"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Full View
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMapItinerary(itinerary)}
                      className="bg-green-600/10 hover:bg-green-600/20 text-green-400 px-4 py-2 rounded-lg flex items-center transition-all duration-200 font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View Map
                    </button>
                    
                    <button
                      onClick={() => exportToPDF(itinerary, itinerary.id)}
                      disabled={isPdfLoading}
                      className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg flex items-center transition-all duration-200 disabled:opacity-50 font-medium"
                    >
                      {isPdfLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Full View */}
      {modalItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-dark-lighter to-dark rounded-xl border border-dark-light max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 to-blue-500/10 border-b border-dark-light p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {modalItinerary.destination}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/20 text-primary text-sm px-3 py-1 rounded-full font-medium">
                      {modalItinerary.days} {modalItinerary.days === 1 ? 'day' : 'days'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {formatDate(modalItinerary.created_at)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="ml-4 p-2 rounded-lg bg-dark-light hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {renderItineraryDetails(modalItinerary, true)}
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-dark-light/50 px-6 py-4 border-t border-dark-light flex justify-between items-center">
              <button
                onClick={closeModal}
                className="text-gray-300 hover:text-white text-sm font-medium flex items-center transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
              
              <button
                onClick={() => exportToPDF(modalItinerary, modalItinerary.id)}
                disabled={pdfLoading === modalItinerary.id}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg flex items-center transition-all duration-200 disabled:opacity-50 font-medium"
              >
                {pdfLoading === modalItinerary.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMapItinerary(null)}></div>
          <div className="relative bg-dark border border-dark-light rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-dark-light">
              <h3 className="text-xl font-semibold text-white">
                📍 Map View: {mapItinerary.destination}
              </h3>
              <button
                onClick={() => setMapItinerary(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <Map
                itinerary={mapItinerary}
                height="500px"
                zoom={10}
                showControls={true}
              />
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </>
  );
};

export default History;