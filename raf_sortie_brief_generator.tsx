import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Radio, Clock, FileText, Copy, CheckCircle, Navigation, Crosshair, Sparkles, Loader2, Globe, Shield, Terminal } from 'lucide-react';

const ZuluClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatZulu = (date) => {
    const h = date.getUTCHours().toString().padStart(2, '0');
    const m = date.getUTCMinutes().toString().padStart(2, '0');
    const s = date.getUTCSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s} Z`;
  };

  return (
    <div className="flex items-center gap-3 bg-[#1F2937]/80 backdrop-blur-sm border border-[#374151] rounded-lg px-4 py-2 w-fit shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <Globe size={18} className="text-[#60A5FA] animate-pulse" />
      <div className="flex flex-col">
         <span className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] font-bold leading-none mb-1">Current Zulu</span>
         <span className="font-mono text-lg font-bold tracking-widest text-[#E5E7EB] leading-none">{formatZulu(time)}</span>
      </div>
    </div>
  );
};

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', disabled = false }) => (
  <div className="mb-4 relative group">
    <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5 flex items-center gap-2">
      <Icon size={14} className="text-[#6B7280]" />
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-[#111827] border ${disabled ? 'border-[#374151]/50 text-[#6B7280]' : 'border-[#374151] text-[#E5E7EB]'} rounded-md py-2.5 px-3 placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#60A5FA] transition-all font-mono text-sm`}
      />
      {!disabled && (
        <div className="absolute inset-0 border border-[#60A5FA] rounded-md opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity"></div>
      )}
    </div>
  </div>
);

const TextAreaField = ({ label, icon: Icon, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5 flex items-center gap-2">
      <Icon size={14} className="text-[#6B7280]" />
      {label}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full bg-[#111827] border border-[#374151] rounded-md py-2.5 px-3 text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#60A5FA] transition-all resize-none font-mono text-sm"
    />
  </div>
);

export default function App() {
  const [formData, setFormData] = useState({
    operationName: '',
    callsign: '',
    aircraftType: '',
    aircraftCount: '1',
    departureBase: '',
    destinationBase: '',
    takeoffTime: '',
    duration: '',
    missionType: 'Training',
    objectives: '',
    notes: ''
  });

  const [hasOperationName, setHasOperationName] = useState(true);
  const [generatedBrief, setGeneratedBrief] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [calculatedEta, setCalculatedEta] = useState('');

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Helper function to calculate ETA ZULU from Takeoff Time (HHMM format) and Duration (e.g. "1h 45m" or "90m" or "1:45")
  useEffect(() => {
    const { takeoffTime, duration } = formData;
    if (!takeoffTime || !duration) {
      setCalculatedEta('');
      return;
    }

    // Clean up takeoff time (e.g. "1430Z", "1430" -> "1430")
    const cleanTime = takeoffTime.replace(/[^0-9]/g, '');
    if (cleanTime.length !== 4) {
      setCalculatedEta('');
      return;
    }

    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = parseInt(cleanTime.substring(2, 4), 10);

    if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) {
      setCalculatedEta('');
      return;
    }

    // Parse duration string for hours and minutes
    let addHours = 0;
    let addMinutes = 0;

    const lowerDuration = duration.toLowerCase();
    
    // Match patterns like "1h", "1h 45m", "45m", "1:45"
    const hourMatch = lowerDuration.match(/(\d+)\s*(?:h|hr|hours?)/);
    const minMatch = lowerDuration.match(/(\d+)\s*(?:m|min|mins?)/);
    const colonMatch = lowerDuration.match(/^(\d+):(\d+)$/);

    if (colonMatch) {
      addHours = parseInt(colonMatch[1], 10);
      addMinutes = parseInt(colonMatch[2], 10);
    } else {
      if (hourMatch) addHours = parseInt(hourMatch[1], 10);
      if (minMatch) addMinutes = parseInt(minMatch[1], 10);
      // Fallback if just numbers entered like "90"
      if (!hourMatch && !minMatch && !colonMatch) {
        const rawNum = parseInt(duration.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(rawNum)) {
          addMinutes = rawNum;
        }
      }
    }

    const totalMinutes = hours * 60 + minutes + addHours * 60 + addMinutes;
    const finalMinutesPerDay = 24 * 60;
    const netMinutes = ((totalMinutes % finalMinutesPerDay) + finalMinutesPerDay) % finalMinutesPerDay;

    const finalHours = Math.floor(netMinutes / 60).toString().padStart(2, '0');
    const finalMins = (netMinutes % 60).toString().padStart(2, '0');

    setCalculatedEta(`${finalHours}${finalMins}Z`);
  }, [formData.takeoffTime, formData.duration]);

  useEffect(() => {
    const generateMarkdown = () => {
      const {
        operationName, callsign, aircraftType, aircraftCount,
        departureBase, destinationBase, takeoffTime, duration,
        missionType, objectives, notes
      } = formData;

      const title = (hasOperationName && operationName) ? `**OPERATION ${operationName.toUpperCase()}**` : '**SORTIE BRIEF**';
      
      let brief = `> 🛫 ${title} 🛫\n> \n`;
      brief += `> **Mission Type:** \`${missionType || 'N/A'}\`\n`;
      
      brief += `> **__Assets__**\n`;
      brief += `> **Callsign:** \`${callsign || 'TBC'}\`\n`;
      brief += `> **Aircraft:** \`${aircraftCount || '1'}x ${aircraftType || 'TBC'}\`\n`;
      brief += `> \n`;
      
      brief += `> **__Flight Plan__**\n`;
      brief += `> **Departure:** \`${departureBase || 'TBC'}\`\n`;
      brief += `> **Destination:** \`${destinationBase || 'TBC'}\`\n`;
      if (takeoffTime) brief += `> **Takeoff (ZULU):** \`${takeoffTime}\`\n`;
      if (duration) brief += `> **Est. Duration:** \`${duration}\`\n`;
      if (calculatedEta) brief += `> **ETA (ZULU):** \`${calculatedEta}\`\n`;
      brief += `> \n`;

      if (objectives) {
        brief += `> **__Objectives__**\n`;
        brief += `> ${objectives.replace(/\n/g, '\n> ')}\n`;
        brief += `> \n`;
      }

      if (notes) {
        brief += `> **__Additional Notes__**\n`;
        brief += `> ${notes.replace(/\n/g, '\n> ')}\n`;
      }

      setGeneratedBrief(brief);
    };

    generateMarkdown();
  }, [formData, hasOperationName, calculatedEta]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedBrief);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      // Fallback method using a temporary textarea element for restricted iframe environments
      const textArea = document.createElement("textarea");
      textArea.value = generatedBrief;
      textArea.style.position = "fixed";  // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (fallbackErr) {
        console.error('Fallback copy failed', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const generateOperationName = async () => {
    if (!aiPrompt) return;
    setIsGeneratingName(true);
    setHasOperationName(true);
    try {
      const systemPrompt = "You are a military operation naming assistant. Given a description of an RAF (Royal Air Force) sortie or flight, generate a single, realistic, and cool-sounding military operation name. The name should typically be two words, uppercase, like 'RED FLAG', 'SHADOW STRIKE', or 'DESERT STORM'. Do not include quotes, explanations, or any other text. Just return the operation name.";
      const apiKey = ""; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: `Flight description: ${aiPrompt}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const candidate = result.candidates?.[0];
      if (candidate && candidate.content?.parts?.[0]?.text) {
        let generatedName = candidate.content.parts[0].text.trim();
        generatedName = generatedName.replace(/^Operation\s+/i, '').replace(/["']/g, '');
        setFormData(prev => ({ ...prev, operationName: generatedName.toUpperCase() }));
        setAiPrompt('');
      }
    } catch (error) {
      console.error("Failed to generate name:", error);
    } finally {
      setIsGeneratingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E5E7EB] font-sans selection:bg-[#2563EB]/40 relative overflow-hidden">
      
      {/* Background accents representing radar/hud */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent"></div>
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#3B82F6]/10 to-transparent"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1D4ED8]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#1F2937] pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#1E3A8A] p-3 rounded-lg border border-[#3B82F6]/30 shadow-[0_0_20px_rgba(30,58,138,0.5)]">
               <Shield size={32} className="text-[#BFDBFE]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white uppercase flex items-center gap-2">
                RAF Flight Planning
                <span className="text-[#3B82F6] font-normal">|</span>
                <span className="text-[#9CA3AF] text-lg font-light tracking-widest">Briefing System</span>
              </h1>
              <p className="text-[#6B7280] text-sm font-mono mt-1">SECURE DOCUMENT GENERATOR V2.1</p>
            </div>
          </div>
          <ZuluClock />
        </header>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          <div className="xl:col-span-7 space-y-6">
            
            {/* Mission Intel Panel */}
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl relative">
              <div className="bg-[#1F2937]/50 px-6 py-3 border-b border-[#374151] flex items-center gap-3">
                <Terminal size={16} className="text-[#60A5FA]" />
                <h2 className="text-sm font-bold text-[#E5E7EB] uppercase tracking-widest">Mission Intel</h2>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* AI Generator Box */}
                <div className="bg-[#0B0F19] rounded-lg p-5 border border-[#1F2937] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6] opacity-50"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                     <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                       <Sparkles size={14} className="text-[#60A5FA]" />
                       AI Operation Naming
                     </label>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && generateOperationName()}
                      placeholder="Describe the sortie (e.g., 'Low level strike in adverse weather')"
                      className="flex-grow bg-[#111827] border border-[#374151] rounded-md py-2.5 px-3 text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#60A5FA] transition-all font-mono text-sm"
                    />
                    <button
                      onClick={generateOperationName}
                      disabled={isGeneratingName || !aiPrompt}
                      className="bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:bg-[#1F2937] disabled:text-[#6B7280] disabled:border-[#374151] border border-[#3B82F6]/50 text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap font-bold text-sm tracking-wide"
                    >
                      {isGeneratingName ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isGeneratingName ? 'PROCESSING...' : 'GENERATE'}
                    </button>
                  </div>
                </div>
                
                {/* Mission Type & Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} className="text-[#6B7280]" />
                        Operation Name
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-[10px] uppercase text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors">Include</span>
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={hasOperationName}
                            onChange={(e) => setHasOperationName(e.target.checked)}
                            className="appearance-none w-4 h-4 rounded border border-[#374151] bg-[#111827] checked:bg-[#3B82F6] checked:border-[#3B82F6] cursor-pointer transition-colors"
                          />
                          {hasOperationName && <CheckCircle size={12} className="absolute text-white pointer-events-none" />}
                        </div>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData.operationName}
                      onChange={handleChange('operationName')}
                      placeholder="e.g. SHADER"
                      disabled={!hasOperationName}
                      className={`w-full bg-[#111827] border ${!hasOperationName ? 'border-[#374151]/30 text-[#4B5563]' : 'border-[#374151] text-[#E5E7EB]'} rounded-md py-2.5 px-3 placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#60A5FA] transition-all font-mono text-sm uppercase`}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <Crosshair size={14} className="text-[#6B7280]" />
                      Mission Type
                    </label>
                    <select
                      value={formData.missionType}
                      onChange={handleChange('missionType')}
                      className="w-full bg-[#111827] border border-[#374151] rounded-md py-2.5 px-3 text-[#E5E7EB] focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#60A5FA] transition-all font-mono text-sm cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em 1.2em' }}
                    >
                      <option value="Training">Training</option>
                      <option value="CAP (Combat Air Patrol)">CAP (Combat Air Patrol)</option>
                      <option value="CAS (Close Air Support)">CAS (Close Air Support)</option>
                      <option value="Transport / Logistics">Transport / Logistics</option>
                      <option value="Reconnaissance">Reconnaissance</option>
                      <option value="SAR (Search and Rescue)">SAR (Search and Rescue)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Assets Panel */}
              <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl relative">
                 <div className="bg-[#1F2937]/50 px-6 py-3 border-b border-[#374151] flex items-center gap-3">
                  <Plane size={16} className="text-[#60A5FA]" />
                  <h2 className="text-sm font-bold text-[#E5E7EB] uppercase tracking-widest">Asset Allocation</h2>
                </div>
                <div className="p-6 space-y-1">
                  <InputField label="Callsign" icon={Radio} value={formData.callsign} onChange={handleChange('callsign')} placeholder="e.g. ASCOT 11" />
                  <InputField label="Aircraft Type" icon={Plane} value={formData.aircraftType} onChange={handleChange('aircraftType')} placeholder="e.g. Typhoon FGR4" />
                  <InputField label="Quantity" icon={Plane} type="number" value={formData.aircraftCount} onChange={handleChange('aircraftCount')} placeholder="1" />
                </div>
              </div>

              {/* Flight Plan Panel */}
              <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl relative">
                 <div className="bg-[#1F2937]/50 px-6 py-3 border-b border-[#374151] flex items-center gap-3">
                  <Navigation size={16} className="text-[#60A5FA]" />
                  <h2 className="text-sm font-bold text-[#E5E7EB] uppercase tracking-widest">Flight Plan</h2>
                </div>
                <div className="p-6 space-y-1">
                  <InputField label="Departure" icon={MapPin} value={formData.departureBase} onChange={handleChange('departureBase')} placeholder="e.g. EGQS (Lossiemouth)" />
                  <InputField label="Destination" icon={MapPin} value={formData.destinationBase} onChange={handleChange('destinationBase')} placeholder="e.g. EGXC (Coningsby)" />
                  <div className="grid grid-cols-2 gap-4">
                     <InputField label="Takeoff (Z)" icon={Clock} value={formData.takeoffTime} onChange={handleChange('takeoffTime')} placeholder="1430Z" />
                     <InputField label="Duration" icon={Clock} value={formData.duration} onChange={handleChange('duration')} placeholder="1h 45m" />
                  </div>
                  
                  {/* Calculated ETA preview badge */}
                  {calculatedEta && (
                    <div className="mt-2 bg-[#1E3A8A]/30 border border-[#3B82F6]/40 rounded-md px-3 py-2 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#9CA3AF] uppercase">Calculated ETA:</span>
                      <span className="text-[#60A5FA] font-bold tracking-wider">{calculatedEta}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tactical Notes Panel */}
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl relative mb-8">
              <div className="bg-[#1F2937]/50 px-6 py-3 border-b border-[#374151] flex items-center gap-3">
                <FileText size={16} className="text-[#60A5FA]" />
                <h2 className="text-sm font-bold text-[#E5E7EB] uppercase tracking-widest">Tactical Briefing</h2>
              </div>
              <div className="p-6">
                <TextAreaField label="Mission Objectives" icon={Crosshair} value={formData.objectives} onChange={handleChange('objectives')} placeholder="Primary and secondary objectives for this sortie..." />
                <TextAreaField label="Additional Notes / Loadout" icon={FileText} value={formData.notes} onChange={handleChange('notes')} placeholder="Weapons payload, specific comms channels, hazards..." />
              </div>
            </div>

          </div>

          <div className="xl:col-span-5 xl:sticky xl:top-8 flex flex-col xl:h-[calc(100vh-6rem)]">
            
            <div className="bg-[#111827]/90 backdrop-blur-md border border-[#1F2937] rounded-xl flex-grow flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5">
              
              {/* Output Header */}
              <div className="bg-[#1F2937] px-6 py-4 border-b border-[#374151] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Discord Format</h2>
                </div>
                
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                    copied 
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50' 
                      : 'bg-[#5865F2] hover:bg-[#4752C4] text-white border border-[#5865F2]'
                  }`}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'COPIED TO CLIPBOARD' : 'COPY BRIEF'}
                </button>
              </div>

              {/* Discord Preview Area */}
              <div className="bg-[#313338] p-6 font-sans text-[15px] leading-relaxed text-[#dbdee1] flex-grow overflow-auto whitespace-pre-wrap">
                <div className="border-l-4 border-[#4f545c] pl-4 py-1">
                  {generatedBrief.split('\n').map((line, i) => {
                    let content = line.replace(/^> /, ''); 
                    
                    content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
                    content = content.replace(/`(.*?)`/g, '<code class="bg-[#1e1f22] text-[#dbdee1] px-1.5 py-0.5 rounded text-[14px] font-mono shadow-sm border border-[#404249]">$1</code>');
                    content = content.replace(/__(.*?)__/g, '<u class="underline decoration-1 underline-offset-2">$1</u>');

                    return (
                      <div key={i} className="min-h-[1.5rem]" dangerouslySetInnerHTML={{ __html: content }} />
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-[#2B2D31] px-4 py-3 border-t border-[#1E1F22]">
                 <p className="text-xs text-[#949BA4] text-center font-medium">
                  Brief is pre-formatted with Discord Markdown.
                 </p>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}