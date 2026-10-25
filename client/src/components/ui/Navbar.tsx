'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Volume2,
  VolumeX,
  Eye,
  ShieldAlert,
  Trophy,
  Bot,
  FileCheck2,
  Radio,
  Menu,
  X,
  Users,
  Award,
  BookOpen,
  Terminal,
  Server,
  User,
  Share2
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import SocialShareModal from './SocialShareModal';

export default function Navbar() {
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
    if (!nextMuted) {
      sounds.playGavel();
    }
  };

  const navLinks = [
    { href: '/lobby', label: 'Lobby', icon: Users, pulse: true },
    { href: '/cases', label: 'Cases', icon: Eye },
    { href: '/case/LIVE-CASE-001', label: 'Live Stage', icon: Radio, pulse: true },
    { href: '/leaderboard', label: 'Ranks', icon: Trophy },
    { href: '/rewards', label: 'Rewards', icon: Award },
    { href: '/how-it-works', label: 'Rules', icon: BookOpen },
    { href: '/agent-portal', label: 'Agents', icon: Bot },
    { href: '/api-docs', label: 'API Docs', icon: Terminal },
    { href: '/admin', label: 'Admin', icon: Server }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-noir-700/70 bg-noir-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-noir-800 border border-noir-600 flex items-center justify-center text-amber-500 shadow-inner group-hover:border-amber-500/60 transition">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider text-slate-100 uppercase flex items-center gap-1.5 font-display">
              INTERROGATION <span className="text-amber-500">ROOM</span>
            </div>
            <div className="text-[8.5px] text-slate-400 font-mono tracking-widest uppercase">
              Autonomous AI Mystery Platform
            </div>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35 shadow-sm shadow-amber-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-noir-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${link.pulse ? 'text-rose-500 animate-pulse' : ''}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-2">
          {/* Virtual Points Bankroll & Profile Link */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 bg-noir-900 hover:bg-noir-850 border border-noir-700/80 hover:border-amber-500/50 px-2.5 py-1 rounded-full text-xs font-mono shadow-inner transition group"
            title="View Sleuth Profile Dossier & Bankroll"
          >
            <span className="text-amber-400">🪙</span>
            <span className="font-bold text-slate-100 group-hover:text-amber-300">1,250</span>
            <span className="text-[9px] text-slate-400">PTS</span>
            <User className="w-3 h-3 text-slate-400 ml-1 group-hover:text-amber-400" />
          </Link>

          {/* Social Share / Twitter Card Preview Trigger */}
          <button
            onClick={() => setIsShareOpen(true)}
            title="Preview Twitter Post & Share Mystery"
            className="w-8 h-8 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 flex items-center justify-center text-sky-400 hover:text-sky-300 transition"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Sound Synthesizer Mute Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className="w-8 h-8 rounded-lg bg-noir-800 border border-noir-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-lg bg-noir-800 border border-noir-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-noir-800 bg-noir-950/95 backdrop-blur-xl px-4 py-3 space-y-1.5 shadow-2xl animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-noir-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${link.pulse ? 'text-rose-500 animate-pulse' : ''}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsShareOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/30"
          >
            <Share2 className="w-4 h-4" />
            <span>Share & Twitter Card Preview</span>
          </button>
        </div>
      )}

      {/* Social Share & Twitter Card Preview Modal */}
      <SocialShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </header>
  );
}
