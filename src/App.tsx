import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Player from './components/Player';
import Library from './components/Library';
import Settings from './components/Settings';
import Search from './components/Search';
import { AnimatePresence, motion } from 'motion/react';

function AnimatedRoutes() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/player');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route 
          path="/" 
          element={
            <Layout>
              <PageWrapper pageKey="home"><Home /></PageWrapper>
            </Layout>
          } 
        />
        <Route 
          path="/search" 
          element={
            <Layout>
              <PageWrapper pageKey="search"><Search /></PageWrapper>
            </Layout>
          } 
        />
        <Route 
          path="/library" 
          element={
            <Layout>
              <PageWrapper pageKey="library"><Library /></PageWrapper>
            </Layout>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <Layout>
              <PageWrapper pageKey="settings"><Settings /></PageWrapper>
            </Layout>
          } 
        />
        <Route 
          path="/player/:id" 
          element={<Player />} 
        />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children, pageKey }: { children: React.ReactNode, pageKey: string }) {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
