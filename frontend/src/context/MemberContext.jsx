import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const MemberContext = createContext();

export const MemberProvider = ({ children }) => {
  const [activeSegment, setActiveSegment] = useState('membre');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ members: [], events: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allEvents, setAllEvents] = useState([]);

  // Fetch events once for local filtering in search
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setAllEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch events for search context:', err);
      }
    };
    fetchEvents();
  }, []);

  const handleSearch = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults({ members: [], events: [] });
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const memberRes = await api.get(`/members/global-search?q=${query}`);
      const filteredEvents = allEvents.filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(query.toLowerCase()))
      );

      setSearchResults({
        members: memberRes.data || [],
        events: filteredEvents
      });
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <MemberContext.Provider value={{ 
      activeSegment, 
      setActiveSegment, 
      searchQuery, 
      setSearchQuery,
      searchResults,
      isSearching,
      showResults,
      setShowResults,
      handleSearch
    }}>
      {children}
    </MemberContext.Provider>
  );
};

export const useMember = () => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
};
