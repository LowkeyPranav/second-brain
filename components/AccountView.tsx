
import React from 'react';
import { Note, ProgressAnalysis } from '../types';

interface AccountViewProps {
  notes: Note[];
  progress: ProgressAnalysis | null;
}

const AccountView: React.FC<AccountViewProps> = ({ notes, progress }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-[#E5E2D9] rounded-3xl p-10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#26BAA4]/5 rounded-full -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10 relative z-10">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#26BAA4] to-[#1A7C6B] flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-[#26BAA4]/20">
            AS
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              <h2 className="text-3xl font-black text-[#2D2D2D] tracking-tight">AI Student</h2>
              <span className="bg-[#26BAA4] text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">Pro Member</span>
            </div>
            <p className="text-[#666] font-medium text-lg mb-4">student@secondbrain.ai</p>
            <div className="flex items-center justify-center md:justify-start space-x-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#AAA] uppercase tracking-widest">Rank</span>
                <span className="text-sm font-bold text-[#2D2D2D]">Top 5% Expert</span>
              </div>
              <div className="w-[1px] h-8 bg-[#E5E2D9]"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#AAA] uppercase tracking-widest">Member Since</span>
                <span className="text-sm font-bold text-[#2D2D2D]">Feb 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E5E2D9] rounded-3xl p-8 shadow-sm">
          <h3 className="text-sm font-black text-[#26BAA4] uppercase tracking-[0.3em] mb-8">System Usage</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#2D2D2D]">Neural Repository Storage</span>
                <span className="text-xs font-black text-[#26BAA4]">{notes.length} / 500 Files</span>
              </div>
              <div className="h-2 bg-[#FDFCF8] rounded-full border border-[#E5E2D9] overflow-hidden">
                <div className="h-full bg-[#26BAA4]" style={{ width: `${(notes.length / 500) * 100}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#2D2D2D]">AI Reasoning Tokens</span>
                <span className="text-xs font-black text-[#26BAA4]">82% Remaining</span>
              </div>
              <div className="h-2 bg-[#FDFCF8] rounded-full border border-[#E5E2D9] overflow-hidden">
                <div className="h-full bg-[#26BAA4]" style={{ width: '82%' }}></div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E2D9]/50">
              <div className="flex justify-between items-center p-4 bg-[#FDFCF8] rounded-2xl border border-[#E5E2D9]">
                <div>
                  <h4 className="font-bold text-[#2D2D2D]">Second Brain Pro</h4>
                  <p className="text-[10px] text-[#AAA] font-bold uppercase tracking-widest">Active • $19.99/mo</p>
                </div>
                <button className="text-[10px] font-black text-[#26BAA4] uppercase tracking-widest border border-[#26BAA4] px-4 py-2 rounded-xl hover:bg-[#26BAA4] hover:text-white transition-all">
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E2D9] rounded-3xl p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-[#26BAA4] uppercase tracking-[0.3em] mb-2">Settings & Security</h3>
          
          <button className="w-full flex items-center justify-between p-4 bg-white border border-[#E5E2D9] rounded-2xl hover:border-[#26BAA4] transition-all group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#FDFCF8] rounded-xl flex items-center justify-center text-[#AAA] group-hover:text-[#26BAA4] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span className="font-bold text-[#2D2D2D]">Interface Customization</span>
            </div>
            <svg className="w-5 h-5 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-white border border-[#E5E2D9] rounded-2xl hover:border-[#26BAA4] transition-all group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#FDFCF8] rounded-xl flex items-center justify-center text-[#AAA] group-hover:text-[#26BAA4] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <span className="font-bold text-[#2D2D2D]">Privacy & Security</span>
            </div>
            <svg className="w-5 h-5 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-white border border-[#E5E2D9] rounded-2xl hover:border-red-500 transition-all group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#FDFCF8] rounded-xl flex items-center justify-center text-[#AAA] group-hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </div>
              <span className="font-bold text-[#2D2D2D]">Logout Session</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountView;
