import React from 'react';
import { Navbar } from '../components/Navbar';
import { motion } from 'framer-motion';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Glows (Skill UI PRO MAX Pattern) */}
      <div className="fixed top-0 left-0 w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-0 w-[40%] h-[40%] bg-rose-500/5 blur-[120px] rounded-full -z-10" />
      
      <Navbar />
      
      <main className="pt-28 pb-12 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
