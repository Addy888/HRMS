'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, ArrowRight } from 'lucide-react';

export default function LoginRoleSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-250px] left-[-200px] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">FCS Portal</h1>
          <p className="text-sm text-neutral-400">Select your access portal to continue signing in</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HR Card */}
          <button
            onClick={() => router.push('/login/hr')}
            className="flex flex-col justify-between text-left p-8 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-3xl shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-bold text-white">HR Administrator</h2>
                <p className="text-xs text-neutral-450 leading-relaxed">
                  Manage the corporate directory, onboard new employees, review documents, and configure designations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mt-8 group-hover:text-blue-300">
              Access HR Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Employee Card */}
          <button
            onClick={() => router.push('/login/employee')}
            className="flex flex-col justify-between text-left p-8 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-3xl shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-bold text-white">Employee Self-Service</h2>
                <p className="text-xs text-neutral-450 leading-relaxed">
                  Complete onboarding checklist, upload government forms, read company policies, and view details.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-8 group-hover:text-emerald-300">
              Access Employee Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <p className="text-center text-[10px] text-neutral-600">
          🔒 Secure Single Sign-On (SSO) environment by FCS Security operations
        </p>
      </div>
    </div>
  );
}
