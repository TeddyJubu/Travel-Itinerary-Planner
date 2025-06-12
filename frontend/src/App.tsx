// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import ItineraryForm from './components/ItineraryForm';
// import History from './components/History';

// function App() {
//   return (
//     <Router>
//       <div className="min-h-screen bg-dark">
//         <nav className="bg-dark-lighter border-b border-dark-light">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between h-16">
//               <div className="flex items-center">
//                 <Link to="/" className="text-2xl font-bold text-primary">
//                   Travel Planner
//                 </Link>
//               </div>
//               <div className="flex space-x-4">
//                 <Link
//                   to="/"
//                   className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
//                 >
//                   New Itinerary
//                 </Link>
//                 <Link
//                   to="/history"
//                   className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
//                 >
//                   History
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </nav>

//         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <Routes>
//             <Route path="/" element={<ItineraryForm />} />
//             <Route path="/history" element={<History />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import ItineraryForm from './components/ItineraryForm';
// import History from './components/History';

// function App() {
//   return (
//     <Router>
//       <div className="min-h-screen bg-dark">
//         <nav className="bg-dark-lighter border-b border-dark-light">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between h-16">
//               <div className="flex items-center">
//                 <Link to="/" className="text-2xl font-bold text-primary flex items-center">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   Travel Planner
//                 </Link>
//               </div>
//               <div className="flex space-x-4">
//                 <Link
//                   to="/"
//                   className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                   </svg>
//                   New Itinerary
//                 </Link>
//                 <Link
//                   to="/history"
//                   className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   History
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </nav>

//         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <Routes>
//             <Route path="/" element={<ItineraryForm />} />
//             <Route path="/history" element={<History />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;
// import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
// import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
// import ItineraryForm from './components/ItineraryForm';
// import History from './components/History';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiMic, FiSun, FiMoon, FiHome, FiList } from 'react-icons/fi';

// interface ThemeContextType {
//   theme: string;
//   toggleTheme: () => void;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
// export const useTheme = () => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error('useTheme must be used within a ThemeProvider');
//   }
//   return context;
// };

// interface ThemeProviderProps {
//   children: ReactNode;
// }

// const ThemeProvider = ({ children }: ThemeProviderProps) => {
//   const [theme, setTheme] = useState(() => {
//     const saved = localStorage.getItem('theme');
//     if (saved) return saved;
//     return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
//   });

//   useEffect(() => {
//     document.documentElement.classList.remove(theme === 'light' ? 'dark' : 'light');
//     document.documentElement.classList.add(theme);
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   const toggleTheme = useCallback(() => {
//     setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
//   }, []);

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// interface VoiceInputProps {
//   onResult: (transcript: string) => void;
// }

// export const useVoiceInput = ({ onResult }: VoiceInputProps) => {
//   const [listening, setListening] = useState(false);
//   const recognitionRef = React.useRef<SpeechRecognition | null>(null);

//   useEffect(() => {
//     if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const recognition = new SpeechRecognition();
//     recognition.lang = 'en-US';
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;
    
//     recognition.onresult = (event: SpeechRecognitionEvent) => {
//       const transcript = event.results[0][0].transcript;
//       onResult(transcript);
//     };
    
//     recognition.onend = () => {
//       setListening(false);
//     };
    
//     recognitionRef.current = recognition;
//   }, [onResult]);

//   const startListening = () => {
//     if (recognitionRef.current && !listening) {
//       try {
//         recognitionRef.current.start();
//         setListening(true);
//       } catch (err) {
//         console.error('Speech recognition error:', err);
//       }
//     }
//   };

//   const stopListening = () => {
//     if (recognitionRef.current && listening) {
//       recognitionRef.current.stop();
//       setListening(false);
//     }
//   };

//   return { listening, startListening, stopListening };
// };

// function App() {
//   const { theme, toggleTheme } = useTheme();

//   return (
//     <Router>
//       <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
//         <nav className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b`}> 
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between h-16">
//               <NavLink to="/" className="flex items-center text-2xl font-bold text-primary">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Travel Planner
//               </NavLink>
//               <div className="flex items-center space-x-4">
//                 <NavLink to="/" className={({ isActive }: { isActive: boolean }) => 
//                   `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}> 
//                   <FiHome className="h-5 w-5 mr-1" /> <span>New Itinerary</span>
//                 </NavLink>
//                 <NavLink to="/history" className={({ isActive }: { isActive: boolean }) => 
//                   `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}> 
//                   <FiList className="h-5 w-5 mr-1" /> <span>History</span>
//                 </NavLink>
//                 <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
//                   {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </nav>
//         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <AnimatePresence mode="wait">
//             <Routes>
//               <Route path="/" element={
//                 <motion.div key="itinerary" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
//                   <ItineraryForm />
//                 </motion.div>
//               } />
//               <Route path="/history" element={
//                 <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
//                   <History />
//                 </motion.div>
//               } />
//             </Routes>
//           </AnimatePresence>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default () => (
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>
// );
  import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import ItineraryForm from './components/ItineraryForm';
import History from './components/History';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiSun, FiMoon, FiHome, FiList } from 'react-icons/fi';

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <nav className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b`}> 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center text-2xl font-bold text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Travel Planner
            </NavLink>
            <div className="flex items-center space-x-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive 
                    ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                    : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200')}`
                }
              > 
                <FiHome className="h-5 w-5 mr-1" /> <span>New Itinerary</span>
              </NavLink>
              <NavLink 
                to="/history" 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive 
                    ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                    : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200')}`
                }
              > 
                <FiList className="h-5 w-5 mr-1" /> <span>History</span>
              </NavLink>
              <button 
                onClick={toggleTheme} 
                className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <ItineraryForm />
              </motion.div>
            } />
            <Route path="/history" element={
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <History />
              </motion.div>
            } />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default () => (
  <ThemeProvider>
    <Router>
      <App />
    </Router>
  </ThemeProvider>
);