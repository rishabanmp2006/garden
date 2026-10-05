import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        <div className="max-w-[1200px] mx-auto px-6 py-6 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
