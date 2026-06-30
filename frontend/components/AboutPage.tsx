"use client";

import React from "react";
import { Sparkles, Cpu, Compass, Box, Zap, Wand2, ArrowRight, User } from "lucide-react";

interface AboutPageProps {
  onOpenStudio: () => void;
  onOpenPricing: () => void;
}

export default function AboutPage({ onOpenStudio, onOpenPricing }: AboutPageProps) {
  const teamMembers = [
    { name: "Elena Rostova", role: "Co-Founder & Chief Architect", desc: "12+ years designing homes, interiors, and city spaces." },
    { name: "Marcus Chen", role: "AI Lead", desc: "Background in AI image research and visual design tools." },
    { name: "Siddharth Nair", role: "Engineering Lead", desc: "Builds fast, reliable design tools people love to use." }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF9] text-[#0F172A] select-none relative font-sans">

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#4F46E5]/5 to-[#0EA5E9]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto py-20 px-8 space-y-24 relative z-10">

        <div className="text-center space-y-6 max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs text-[#4F46E5] shadow-sm">
            <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
            <span className="font-semibold tracking-wide">About DesAIgn</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0F172A] font-sans leading-[1.1]">
            We turn ideas into <br />
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] bg-clip-text text-transparent">real-looking spaces.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          DesAIgn helps you redesign rooms and buildings from a single photo. Try new materials, explore styles, and see changes instantly — no design degree required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4 relative animate-slide-up delay-100">
          <div className="absolute left-1/2 top-4 bottom-4 w-[1.5px] bg-[#4F46E5]/30 hidden md:block" />

          <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-[#4F46E5] uppercase tracking-widest font-sans mb-3">Our Mission</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                We replace slow, expensive design workflows with fast AI tools anyone can use. Homeowners, designers, and architects can all visualize changes in minutes instead of days.
              </p>
            </div>
            <div className="h-1 w-12 bg-[#4F46E5] rounded" />
          </div>

          <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-[#4F46E5] uppercase tracking-widest font-sans mb-3">Our Vision</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                A world where anyone can try out room and home changes instantly — from a quick renovation idea to a full client presentation.
              </p>
            </div>
            <div className="h-1 w-12 bg-[#4F46E5] rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4 animate-slide-up delay-200">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-sans">
              Faster than traditional design tools
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Old tools need powerful computers and hours of work. DesAIgn finds objects in your photo and lets you change materials in real time — right in your browser.
            </p>
            <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] flex items-center space-x-3 shadow-sm">
              <Cpu className="w-5 h-5 text-[#4F46E5]" />
              <span className="text-xs font-mono text-[#64748B]">Powered by advanced AI detection</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-64 rounded-2xl overflow-hidden border border-[#E2E8F0] flex items-center justify-center bg-white shadow-sm">
              <div className="absolute inset-0 bg-[url('/default.jpg')] bg-cover bg-center opacity-10 grayscale mix-blend-multiply" />
              <div className="relative text-center p-6 space-y-3 z-10">
                <Box className="w-12 h-12 text-[#4F46E5] mx-auto animate-pulse" />
                <span className="block text-[10px] font-mono text-[#0F172A] uppercase tracking-widest font-bold">Interactive design canvas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-[#E2E8F0] py-12 animate-slide-up delay-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto text-[#4F46E5] border border-[#E2E8F0]">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase">Accuracy</h4>
              <p className="text-[10px] text-[#64748B]">Smart object detection</p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto text-[#4F46E5] border border-[#E2E8F0]">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase">Speed</h4>
              <p className="text-[10px] text-[#64748B]">Fast results</p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto text-[#4F46E5] border border-[#E2E8F0]">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase">Accessibility</h4>
              <p className="text-[10px] text-[#64748B]">For homeowners and pros</p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto text-[#4F46E5] border border-[#E2E8F0]">
                <Wand2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase">Freedom</h4>
              <p className="text-[10px] text-[#64748B]">Try endless options</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-4 animate-slide-up delay-400">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Meet the team</h2>
            <p className="text-xs text-[#64748B] uppercase tracking-wider font-mono">Building the future of home and space design</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] p-6 rounded-2xl text-center space-y-4 transition-all duration-300 group hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-full bg-white border border-[#E2E8F0] group-hover:border-[#4F46E5] group-hover:ring-2 group-hover:ring-[#4F46E5]/20 flex items-center justify-center mx-auto text-[#64748B] transition-all duration-200">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">{member.name}</h4>
                  <p className="text-[10px] text-[#64748B] font-mono mt-0.5">{member.role}</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed font-sans">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#4F46E5] border border-[#E2E8F0] p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-slide-up delay-500 shadow-lg">
          <div className="space-y-2 text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">Start your first redesign</h3>
            <p className="text-xs text-white/90 max-w-md font-sans">Turn interior and exterior photos into designs you can edit right away.</p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-8 py-3.5 bg-white hover:bg-[#FAFAF9] text-[#4F46E5] border-0 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center space-x-2 shrink-0 shadow-md"
          >
            <span>Start designing free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
