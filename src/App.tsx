import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileText, 
  Clipboard, 
  Check, 
  Sparkles, 
  Code, 
  Database,
  ArrowRight,
  RefreshCw,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

// Types matching the server JSON structure
interface OCRSection {
  id: string;
  page: string;
  original: string;
  translation: string;
}

interface OCRStats {
  chars: number;
  latency: number;
  engine: string;
  error?: string;
}

export default function App() {
  // --- STATE ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("TAMIL_BOOK_INDEX_vii.PNG");
  const [isPreloaded, setIsPreloaded] = useState<boolean>(true); // Starts with preloaded Tamil index!
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>("");
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [sections, setSections] = useState<OCRSection[]>([]);
  const [stats, setStats] = useState<OCRStats | null>(null);
  const [viewMode, setViewMode] = useState<"text" | "sections" | "json">("text");
  const [clipboardCopied, setClipboardCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("SYSTEM_READY");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // File picker reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PRELOADED TAMIL BOOK INDEX CONSTANTS ---
  const PRELOADED_TAMIL_TEXT = `vii
113. D.D.T. விஷம் —— ஓர் மகான் யாகத்திற்கான பொருள்களை ராவணனிடமிருந்து பெற்ற நிகழ்ச்சி -- 123
115. முன்பின் யோசனையில்லா விஞ்ஞானம் —— ஒரு சில விஞ்ஞான விளைவுகளின் உதாரணங்கள். -- 126
117. பண்டைய சீனாவின் சிறப்புச் சுருக்கம் —— பண்டைய உலகத்திய ஆத்மீக ஸ்தாபனங்கள் -- 131
123. வடக்கிருத்தல் ஜீவராசிகளின் பிறவிகள் -- 138
124. ஸ்பார்ட்டாவின் தந்தையான லைகர்கஸ் Lycurgus -- 140
126. எகிப்தியச் சுருக்கம்; ஸูரிய வம்சத்திற்குப் புத்துயிர் -- 147
131. ராசி மண்டலம்: விஷுத் துருவம் போன்றவைகளின் இடப்பெயர்ச்சி மேற்கு திசையில் ஸูரிய உதயம் -- 169
133. காகிதத்தின் அநுகூலமும் ப்ரதிகூலமும் -- 186
138. பண்டைய தெய்வ விவேகிகள் சிவலிங்க உபாஸகர்கள் —— ரோமிய எட்ரஸ்கன்கள் -- 188
143. ஞானப்பாதைக்கான தொகுப்பு -- 192
144. பண்டைய யூதமத போலிச் சாமியார்கள் -- 192
148. அன்னிய நாடுகளில் ஸம்ஸ்க்ருதம் —— ‘எந்தரோ மகானுபாவலு’ த்யாகராஜ ஸ்வாமிகள் -- 199
150. ஓர் வேந்தனின் மூலம் தெய்வீக நிவர்த்தி -- 201
151. நமது நாட்டின் செல்வம் —— பண்டைய எகிப்தியர்களின் தாய்நாடு -- 203
153. வருந்தி ஒப்புதல் —— மனுநீதி சோழர் -- 205
155. பலாத்கார மத மாற்றம்: எகிப்து, பல்கேரியா, காவா, மெக்கா —— ஆரம்ப கிருஸ்தவர்களின் லிங்க வழிபாடு —— நாகூர் தர்க்காவும் வேளாங்கன்னியும் —— தெய்வங்களின் இயக்கத்தை உறுதிபடுத்திய கிருஸ்தவ மேதைகள் —— பைபிளின் ப்ரகாரம் உலக உற்பத்தியும் முதல் மனிதனும் —— அப்ரஹாம் என்கிற அபிராம் -- 209
156. ஸர்வம் லிங்கமயம், —— ஜான் என்ற துறவி —— Bogomiles என்ற சந்யாசிகள் -- 234`;

  const PRELOADED_SECTIONS: OCRSection[] = [
    { id: "113", page: "123", original: "113. D.D.T. விஷம் —— ஓர் மகான் யாகத்திற்கான பொருள்களை ராவணனிடமிருந்து பெற்ற நிகழ்ச்சி", translation: "113. D.D.T. poison — An event of receiving materials for an eminent sacrifice from Ravana" },
    { id: "115", page: "126", original: "115. முன்பின் யோசனையில்லா விஞ்ஞானம் —— ஒரு சில விஞ்ஞான விளைவுகளின் உதாரணங்கள்.", translation: "115. Science without foresight — Examples of some scientific consequences" },
    { id: "117", page: "131", original: "117. பண்டைய சீனாவின் சிறப்புச் சுருக்கம் —— பண்டைய உலகத்திய ஆத்மீக ஸ்தாபனங்கள்", translation: "117. A special summary of Ancient China — Spiritual institutions of the ancient world" },
    { id: "123", page: "138", original: "123. வடக்கிருத்தல் ஜீவராசிகளின் பிறவிகள்", translation: "123. Fasting unto death (Vadakkiruthal) — Births of living beings" },
    { id: "124", page: "140", original: "124. ஸ்பார்ட்டாவின் தந்தையான லைகர்கஸ் Lycurgus", translation: "124. Lycurgus, the father of Sparta" },
    { id: "126", page: "147", original: "126. எகிப்தியச் சுருக்கம்; ஸூரிய வம்சத்திற்குப் புத்துயிர்", translation: "126. Egyptian summary; Revival of the Solar Dynasty" },
    { id: "131", page: "169", original: "131. ராசி மண்டலம்: விஷுத் துருவம் போன்றவைகளின் இடப்பெயர்ச்சி மேற்கு திசையில் ஸูரிய உதயம்", translation: "131. Zodiac: Displacement of the equinox axis & Sunrise in the West" },
    { id: "133", page: "186", original: "133. காகிதத்தின் அநுகூலமும் ப்ரதிகூலமும்", translation: "133. Advantages and disadvantages of paper" },
    { id: "138", page: "188", original: "138. பண்டைய தெய்வ விவேகிகள் சிவலிங்க உபாஸகர்கள் —— ரோமிய எட்ரஸ்கன்கள்", translation: "138. Ancient divine sages as Shiva Linga worshippers — Roman Etruscans" },
    { id: "143", page: "192", original: "143. ஞானப்பாதைக்கான தொகுப்பு", translation: "143. Compilation of the path of wisdom" },
    { id: "144", page: "192", original: "144. பண்டைய யூதமத போலிச் சாமியார்கள்", translation: "144. Ancient Jewish pseudo-prophets / priests" },
    { id: "148", page: "199", original: "148. அன்னிய நாடுகளில் ஸம்ஸ்க்ருதம் —— ‘எந்தரோ மகானுபாவலு’ த்யாகராஜ ஸ்வாமிகள்", translation: "148. Sanskrit in foreign countries — 'Endaro Mahanubhavulu' Tyagaraja Swamigal" },
    { id: "150", page: "201", original: "150. ஓர் வேந்தனின் மூலம் தெய்வீக நிவர்த்தி", translation: "150. Divine resolution through a sovereign ruler" },
    { id: "151", page: "203", original: "151. நமது நாட்டின் செல்வம் —— பண்டைய எகிப்தியர்களின் தாய்நாடு", translation: "151. The wealth of our country — Motherland of ancient Egyptians" },
    { id: "153", page: "205", original: "153. வருந்தி ஒப்புதல் —— மனுநீதி சோழர்", translation: "153. Sorrowful confession — Manuneethi Cholan" },
    { id: "155", page: "209", original: "155. பலாத்கார மத மாற்றம்: எகிப்து, பல்கேரியா, காவா, மெக்கா —— ஆரம்ப கிருஸ்தவர்களின் லிங்க வழிபாடு —— நாகூர் தர்க்காவும் வேளாங்கன்னியும் —— தெய்வங்களின் இயக்கத்தை உறுதிபடுத்திய கிருஸ்தவ மேதைகள் —— பைபிளின் ப்ரகாரம் உலக உற்பத்தியும் முதல் மனிதனும் —— அப்ரஹாம் என்கிற அபிராம்", translation: "155. Forced religious conversion: Egypt, Bulgaria, Java, Mecca — Linga worship of early Christians — Nagore Dargah & Velankanni — Christian geniuses who confirmed the mechanics of deities — Creation according to Bible & First man — Abraham who is Abiram" },
    { id: "156", page: "234", original: "156. ஸர்வம் லிங்கமயம், —— ஜான் என்ற துறவி —— Bogomiles என்ற சந்யாசிகள்", translation: "156. Everything is Lingam — Friar/monk named John — Ascetics called Bogomiles" }
  ];

  // Initialize with Preloaded Tamil index content immediately
  useEffect(() => {
    setTranscription(PRELOADED_TAMIL_TEXT);
    setDetectedLanguages(["Tamil", "English", "Latin"]);
    setConfidence(98.4);
    setSections(PRELOADED_SECTIONS);
    setStats({
      chars: PRELOADED_TAMIL_TEXT.length,
      latency: 42,
      engine: "Neural_Lite_04"
    });
  }, []);

  // --- HANDLERS ---
  
  // Clean / reset system to empty upload state
  const handleNewExtraction = () => {
    setImagePreview(null);
    setFileName("NEW_UPLOAD.PNG");
    setIsPreloaded(false);
    setTranscription("");
    setDetectedLanguages([]);
    setConfidence(null);
    setSections([]);
    setStats(null);
    setErrorMessage(null);
    setStatusMessage("AWAITING_FILE");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Preload back the default Tamil Page
  const handleLoadSample = () => {
    setIsPreloaded(true);
    setFileName("TAMIL_BOOK_INDEX_vii.PNG");
    setImagePreview(null);
    setTranscription(PRELOADED_TAMIL_TEXT);
    setDetectedLanguages(["Tamil", "English", "Latin"]);
    setConfidence(98.4);
    setSections(PRELOADED_SECTIONS);
    setStats({
      chars: PRELOADED_TAMIL_TEXT.length,
      latency: 42,
      engine: "Neural_Lite_04"
    });
    setErrorMessage(null);
    setStatusMessage("SAMPLE_LOADED");
  };

  // Pick file via clicking button
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Convert uploaded file to base64
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Unsupported file type. Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    
    setFileName(file.name.toUpperCase());
    setIsPreloaded(false);
    setErrorMessage(null);
    setStatusMessage("FILE_LOADED");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Invoke server's Gemini API route to extract text!
  const runExtraction = async () => {
    setIsAnalyzing(true);
    setStatusMessage("SCANNING_GLYPHS");
    setErrorMessage(null);

    try {
      let payloadImage = "";

      // If preloaded, we use a mock representation or generate a custom base64,
      // but since the server already handles default preloaded fallback if no image/or special mock is requested,
      // we can construct a dummy safe base64 or send a custom prompt signal.
      if (isPreloaded) {
        // Send index mock identifier or standard pre-recorded item,
        // we can just send a transparent minimal PNG pixel or sample data to represent it.
        payloadImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      } else if (imagePreview) {
        payloadImage = imagePreview;
      } else {
        throw new Error("No image present to analyze. Please upload an image or load the Tamil sample.");
      }

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: payloadImage })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: Failed to invoke Neural OCR Engine`);
      }

      const data = await response.json();
      
      setTranscription(data.extractedText || "No text could be extracted.");
      setDetectedLanguages(data.detectedLanguages || ["Tamil"]);
      setConfidence(data.confidence || 95.0);
      setSections(data.sections || []);
      setStats(data.stats || {
        chars: (data.extractedText || "").length,
        latency: 420,
        engine: "Neural_Engine_Offline"
      });
      setStatusMessage("EXTRACTION_SUCCESS");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "An unexpected error occurred during OCR text extraction.");
      setStatusMessage("SYSTEM_ERROR");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy results to clipboard
  const copyToClipboard = () => {
    let copyText = "";
    if (viewMode === "text") {
      copyText = transcription;
    } else if (viewMode === "sections") {
      copyText = sections.map(s => `${s.id}. [Page ${s.page}]\nOriginal: ${s.original}\nEnglish: ${s.translation}`).join("\n\n");
    } else {
      copyText = JSON.stringify({ confidence, detectedLanguages, stats, sections }, null, 2);
    }

    navigator.clipboard.writeText(copyText).then(() => {
      setClipboardCopied(true);
      setTimeout(() => setClipboardCopied(false), 2000);
    });
  };

  // Export results as formatted JSON file
  const exportJsonFile = () => {
    const dataStr = JSON.stringify({
      fileName,
      detectedLanguages,
      confidence,
      stats,
      sections,
      fullTranscription: transcription
    }, null, 2);
    
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${fileName.toLowerCase().replace(/\.[^/.]+$/, "")}_extracted.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="w-full min-h-screen bg-[#EBEBEB] text-[#1A1A1A] flex flex-col font-sans selection:bg-black selection:text-[#EBEBEB] overflow-x-hidden">
      
      {/* HEADER SECTION - Absolute Artistic Flair */}
      <header className="h-24 border-b-2 border-black flex items-center justify-between px-6 md:px-10 bg-[#EBEBEB] z-10">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter leading-none uppercase select-none">
            Extr_ct.txt
          </h1>
          <span className="text-[9px] md:text-[10px] font-mono tracking-widest opacity-60 uppercase mt-1">
            Textual Processing Engine // Alpha 0.84
          </span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Current Session</p>
            <p className="font-mono text-xs font-semibold">{fileName}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLoadSample}
              className="px-3 py-2 border-2 border-black bg-white hover:bg-[#EBEBEB] text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              title="Load Preloaded Tamil Index Page"
            >
              Load Sample
            </button>
            <button 
              onClick={handleNewExtraction}
              className="px-4 py-2 bg-black text-white hover:bg-[#333] text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
            >
              New Upload
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW - Sidebar + Two Panels Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden border-b-2 border-black">
        
        {/* SIDEBAR TOOLS - Pure Structural Iconography Aesthetic */}
        <nav className="w-full md:w-20 border-b-2 md:border-b-0 md:border-r-2 border-black flex md:flex-col items-center justify-between md:justify-start py-4 md:py-8 px-6 md:px-0 gap-6 md:gap-10 bg-[#E0E0E0]">
          <div className="flex md:flex-col items-center gap-4 md:gap-6">
            <div 
              className={`w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-sm cursor-pointer transition-all ${viewMode === 'text' ? 'bg-black text-white shadow-none' : 'bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
              onClick={() => setViewMode("text")}
              title="Show Raw Text Script"
            >
              txt
            </div>
            <div 
              className={`w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-sm cursor-pointer transition-all ${viewMode === 'sections' ? 'bg-black text-white shadow-none' : 'bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
              onClick={() => setViewMode("sections")}
              title="Show Deconstructed Blocks"
            >
              col
            </div>
            <div 
              className={`w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-sm cursor-pointer transition-all ${viewMode === 'json' ? 'bg-black text-white shadow-none' : 'bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
              onClick={() => setViewMode("json")}
              title="View Raw JSON Output"
            >
              {`{}`}
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-center mt-auto gap-4">
            <span className="text-[9px] font-mono font-bold tracking-widest text-black/50 rotate-90 my-6">DECONSTRUCT</span>
            <div className="w-1 h-20 bg-black/10 relative overflow-hidden">
              <motion.div 
                animate={isAnalyzing ? { y: [0, 80, 0] } : { y: 0 }}
                transition={isAnalyzing ? { repeat: Infinity, duration: 1.5, ease: "linear" } : {}}
                className="absolute top-0 w-full h-1/2 bg-black"
              />
            </div>
          </div>
        </nav>

        {/* WORKSPACE PANELS */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
          
          {/* PANEL 1: SOURCE PREVIEW & DYNAMIC OCR TRIGGERS */}
          <section className="w-full lg:w-1/2 border-b-2 lg:border-b-0 lg:border-r-2 border-black p-6 md:p-8 flex flex-col bg-[#FCFCFC] relative overflow-y-auto">
            
            {/* HUD Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-black/40 font-bold">[ 01 ]</span>
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-black/70">Source Workspace</h2>
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-black/40 uppercase tracking-wider">Aesthetic Canvas</span>
              </div>
            </div>

            {/* Document Workspace Center Container */}
            <div 
              className={`flex-1 min-h-[380px] lg:min-h-[460px] bg-white border-2 border-black p-4 md:p-6 relative transition-all flex flex-col justify-between overflow-hidden ${isDragOver ? "border-dashed border-neutral-600 bg-neutral-100 scale-[0.99]" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Radial Pattern Grid Dot Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1.2px, transparent 0)", backgroundSize: "16px 16px" }} />

              {/* RENDER VIEW 1: Preloaded book index replica */}
              {isPreloaded && !imagePreview ? (
                <div className="flex-1 flex flex-col justify-between bg-[#FAF7ED] p-4 md:p-8 border border-neutral-300 shadow-md relative rounded-sm font-serif select-none overflow-y-auto max-h-[450px]">
                  
                  {/* Page header numbering vii in photo */}
                  <div className="text-center text-sm italic text-neutral-500 mb-4 select-none">vii</div>
                  
                  {/* Render simulated book typesetting lines aligned perfectly to the original page layout */}
                  <div className="space-y-4 text-xs md:text-[13px] leading-relaxed text-neutral-800 tracking-wide font-sans md:font-serif">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">113.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        D.D.T. விஷம் <span className="text-red-900/60 font-mono mx-1">——</span> ஓர் மகான் யாகத்திற்கான பொருள்களை ராவணனிடமிருந்து பெற்ற நிகழ்ச்சி
                      </span>
                      <span className="font-mono font-bold text-neutral-600">123</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">115.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        முன்பின் யோசனையில்லா விஞ்ஞானம் <span className="text-red-900/60 font-mono mx-1">——</span> ஒரு சில விஞ்ஞான விளைவுகளின் உதாரணங்கள்.
                      </span>
                      <span className="font-mono font-bold text-neutral-600">126</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">117.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        பண்டைய சீனாவின் சிறப்புச் சுருக்கம் <span className="text-red-900/60 font-mono mx-1">——</span> பண்டைய உலகத்திய ஆத்மீக ஸ்தாபனங்கள்
                      </span>
                      <span className="font-mono font-bold text-neutral-600">131</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">123.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        வடக்கிருத்தல் ஜீவராசிகளின் பிறவிகள்
                      </span>
                      <span className="font-mono font-bold text-neutral-600">138</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">124.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        ஸ்பார்ட்டாவின் தந்தையான லைகர்கஸ் Lycurgus
                      </span>
                      <span className="font-mono font-bold text-neutral-600">140</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">126.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        எகிப்தியச் சுருக்கம்; ஸூரிய வம்சத்திற்குப் புத்துயிர்
                      </span>
                      <span className="font-mono font-bold text-neutral-600">147</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">131.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        ராசி மண்டலம்: விஷுத் துருவம் போன்றவைகளின் இடப்பெயர்ச்சி மேற்கு திசையில் ஸூரிய உதயம்
                      </span>
                      <span className="font-mono font-bold text-neutral-600">169</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">133.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        காகிதத்தின் அநுகூலமும் ப்ரதிகூலமும்
                      </span>
                      <span className="font-mono font-bold text-neutral-600">186</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">138.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        பண்டைய தெய்வ விவேகிகள் சிவலிங்க உபாஸகர்கள் <span className="text-red-900/60 font-mono mx-1">——</span> ரோமிய எட்ரஸ்கன்கள்
                      </span>
                      <span className="font-mono font-bold text-neutral-600">188</span>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[#841919] font-bold">143.</span>
                      <span className="flex-1 border-b border-dotted border-neutral-400 pb-1">
                        ஞானப்பாதைக்கான தொகுப்பு
                      </span>
                      <span className="font-mono font-bold text-neutral-600">192</span>
                    </div>
                    
                    <div className="text-center font-mono opacity-40 text-[9px] tracking-widest my-2 select-none border-y border-dashed border-stone-300 py-1 uppercase">
                      TRUNCATED IN INTERFACE PREVIEW // CLICK BELOW TO DECODE ALL LINES
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-dashed border-neutral-300 flex justify-between items-center text-[10px] font-mono text-neutral-500">
                    <span>ARCHIVE_REF: vii_113_156</span>
                    <span>TAMIL ORIGINAL TEXT</span>
                  </div>

                </div>
              ) : imagePreview ? (
                /* RENDER VIEW 2: Uploaded User Image */
                <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-[#FAF9F6]">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded OCR source" 
                    className="max-h-[360px] object-contain border border-neutral-200 shadow-sm"
                  />
                  <div className="mt-4 text-[10px] font-mono text-neutral-400 truncate max-w-xs text-center uppercase tracking-wider">
                    {fileName}
                  </div>
                </div>
              ) : (
                /* RENDER VIEW 3: Empty State Dropzone */
                <div 
                  onClick={triggerFileSelect}
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors p-8 text-center"
                >
                  <Upload className="w-12 h-12 text-black/30 mb-4 stroke-1" />
                  <p className="font-display font-bold text-sm tracking-wide uppercase mb-1">
                    Drag and Drop document page
                  </p>
                  <p className="text-xs text-neutral-400 max-w-xs font-sans">
                    Supports PNG, JPEG, WEBP files. Or click to browse folders.
                  </p>
                  <div className="mt-4 px-4 py-1 bg-black text-white text-[10px] font-mono uppercase font-bold tracking-widest">
                    SELECT_FILE
                  </div>
                </div>
              )}

              {/* Laser Scanning HUD animation overlay during OCR processing */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-900/10 pointer-events-none flex flex-col justify-between"
                  >
                    <motion.div 
                      initial={{ y: "0%" }}
                      animate={{ y: "100%" }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 2.2, 
                        ease: "easeInOut" 
                      }}
                      className="w-full h-[3px] bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] z-20 relative"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-black text-white text-[10px] font-mono p-2 flex justify-between items-center z-30 uppercase tracking-widest">
                      <span>Neural Scan Pulse... </span>
                      <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions Panel below preview container */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <button 
                onClick={triggerFileSelect}
                className="flex-1 h-12 border-2 border-black bg-white hover:bg-[#F3F3F3] text-black font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <Upload className="w-4 h-4 ml-1 stroke-2" />
                Upload New Image
              </button>

              <button 
                onClick={runExtraction}
                disabled={isAnalyzing || (!imagePreview && !isPreloaded)}
                className={`flex-1 h-12 flex items-center justify-center gap-2 uppercase font-mono font-bold text-xs tracking-wider transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                  isAnalyzing || (!imagePreview && !isPreloaded)
                    ? "bg-stone-300 text-stone-500 border border-stone-200 cursor-not-allowed shadow-none"
                    : "bg-black text-white hover:bg-zinc-800 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin text-amber-400" : ""}`} />
                {isAnalyzing ? "Processing OCR..." : "Run Neural Extraction"}
              </button>
            </div>

            {/* Instructions list card */}
            <div className="mt-6 bg-neutral-100 border border-neutral-300 p-4 font-mono text-[11px] leading-relaxed text-black/60 relative">
              <div className="flex gap-2">
                <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-800 uppercase mb-1">OCR Instructions</p>
                  <p>1. Toggle <b className="text-black">"Load Sample"</b> to review the Tamil index image provided.</p>
                  <p>2. Drag-and-drop or select any custom image file of your interest.</p>
                  <p>3. Run <b className="text-black">Extraction</b> to trigger server-side Gemini 3.5 OCR analysis.</p>
                </div>
              </div>
            </div>

          </section>

          {/* PANEL 2: EXTRACTED RESULTS & HIGH FIELD RENDERS */}
          <section className="w-full lg:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            
            {/* HUD Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-black/40 font-bold">[ 02 ]</span>
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-black/70">Parsed Document Output</h2>
              </div>
              <div className="flex gap-2">
                {confidence !== null && (
                  <span className="text-[10px] font-mono px-2 py-1 bg-black text-white font-semibold">
                    CONFIDENCE: {confidence}%
                  </span>
                )}
                {detectedLanguages.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-1 bg-stone-200 text-stone-800 font-semibold uppercase">
                    {detectedLanguages.join(" + ")}
                  </span>
                )}
              </div>
            </div>

            {/* Error notifications container */}
            {errorMessage && (
              <div className="mb-6 bg-red-50 border-2 border-red-500 p-4 text-red-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs font-mono">
                  <p className="font-bold uppercase tracking-wider mb-1">Engine Warning</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Dynamic tabs toggling between Views */}
            <div className="flex border-b-2 border-black mb-6">
              <button 
                onClick={() => setViewMode("text")}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase border-t-2 border-x-2 border-transparent transition-all ${
                  viewMode === "text" 
                    ? "border-black bg-white translate-y-[2px]" 
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                Plain Transcript
              </button>
              <button 
                onClick={() => setViewMode("sections")}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase border-t-2 border-x-2 border-transparent transition-all ${
                  viewMode === "sections" 
                    ? "border-black bg-white translate-y-[2px]" 
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                Hierarchical Sections
              </button>
              <button 
                onClick={() => setViewMode("json")}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase border-t-2 border-x-2 border-transparent transition-all ${
                  viewMode === "json" 
                    ? "border-black bg-white translate-y-[2px]" 
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                Structure .JSON
              </button>
            </div>

            {/* MAIN TRANSCRIPT CARDS */}
            <div className="flex-1 min-h-[300px] lg:min-h-[380px] border-l-2 border-stone-200 pl-4 md:pl-6 py-2 overflow-y-auto max-h-[460px]">
              
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col justify-center items-center py-10"
                  >
                    <RefreshCw className="w-8 h-8 text-black animate-spin mb-4" />
                    <p className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/60">Parsing typographic syntax...</p>
                  </motion.div>
                ) : viewMode === "text" ? (
                  
                  /* TAB 1: PLAIN TEXT TRANSCRIPT (Playfair Display elegant style) */
                  <motion.div 
                    key="text_view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="font-serif text-[15px] md:text-lg leading-relaxed text-[#2B2B2B] whitespace-pre-wrap selection:bg-neutral-600 selection:text-white"
                  >
                    {transcription ? (
                      <div className="prose prose-stone max-w-none">
                        {transcription.split('\n').map((line, idx) => {
                          const isHeader = line.toLowerCase().trim() === 'vii';
                          return (
                            <p 
                              key={idx} 
                              className={`${
                                isHeader 
                                  ? "text-center text-xl font-bold tracking-widest italic my-4 text-black" 
                                  : "mb-3 tracking-wide"
                              }`}
                            >
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="font-sans text-xs italic text-neutral-400 font-mono text-center py-20 uppercase tracking-widest">
                        Awaiting extraction sequence.
                      </p>
                    )}
                  </motion.div>

                ) : viewMode === "sections" ? (
                  
                  /* TAB 2: DETAILED SECTIONS WITH TRANSLATIONS */
                  <motion.div 
                    key="sections_view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {sections && sections.length > 0 ? (
                      sections.map((item, index) => (
                        <div 
                          key={index}
                          className="border border-neutral-300 bg-neutral-50/50 p-4 relative group hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex justify-between items-center mb-2 border-b border-neutral-200 pb-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                              INDEX #{item.id}
                            </span>
                            {item.page && (
                              <span className="font-mono text-[10px] text-neutral-500 font-bold">
                                PAGE: {item.page}
                              </span>
                            )}
                          </div>
                          
                          {/* Tamil Original text */}
                          <p className="font-sans font-medium text-sm text-neutral-900 tracking-wide mb-3 leading-relaxed">
                            {item.original}
                          </p>

                          {/* English Translation section */}
                          {item.translation && (
                            <div className="border-t border-dashed border-stone-300 pt-2 mt-2">
                              <span className="font-mono text-[9px] text-[#841919] uppercase tracking-wider font-bold block mb-1">
                                Translation Annotation
                              </span>
                              <p className="font-serif italic text-sm text-[13px] text-stone-600 leading-relaxed">
                                {item.translation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="font-sans text-xs italic text-neutral-400 font-mono text-center py-20 uppercase tracking-widest">
                        No structural sections parsed yet.
                      </p>
                    )}
                  </motion.div>

                ) : (

                  /* TAB 3: EXTRACTED JSON STRUCTURE DATA */
                  <motion.div 
                    key="json_view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    {sections && sections.length > 0 ? (
                      <pre className="font-mono text-xs text-stone-700 bg-stone-50 p-4 border border-stone-200 rounded max-h-[380px] overflow-auto leading-normal select-all">
                        {JSON.stringify({
                          sourceFile: fileName,
                          detectedLanguages,
                          confidence,
                          sections: sections,
                          stats: stats
                        }, null, 2)}
                      </pre>
                    ) : (
                      <p className="font-sans text-xs italic text-neutral-400 font-mono text-center py-20 uppercase tracking-widest">
                        No raw JSON data compiled.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Secondary Copy Actions */}
            <div className="mt-8 pt-6 border-t font-mono border-black flex flex-col sm:flex-row gap-4">
              <button 
                onClick={copyToClipboard}
                disabled={!transcription}
                className={`flex-1 h-12 border-2 border-black flex items-center justify-center uppercase font-bold text-xs tracking-widest transition-all gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  !transcription 
                    ? "bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed shadow-none" 
                    : "bg-white hover:bg-black hover:text-white"
                }`}
              >
                {clipboardCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 animate-bounce stroke-[3]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4 stroke-2" />
                    Copy to Clipboard
                  </>
                )}
              </button>

              <button 
                onClick={exportJsonFile}
                disabled={sections.length === 0}
                className={`flex-1 h-12 flex items-center justify-center uppercase font-bold text-xs tracking-widest transition-all gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  sections.length === 0
                    ? "bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed shadow-none"
                    : "bg-black text-white hover:bg-neutral-800 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Code className="w-4 h-4 stroke-2" />
                Export .JSON Layout
              </button>
            </div>

          </section>
          
        </div>
      </main>

      {/* FOOTER STATUS BAR - High Contrast Modernistic Bar with telemetry logs hidden but aesthetic values present */}
      <footer className="h-12 border-t-2 border-black bg-black text-white px-6 md:px-10 flex items-center justify-between font-mono text-[9px] md:text-[10px] tracking-widest">
        <div className="flex items-center gap-4 md:gap-6">
          <span>STATUS: {statusMessage}</span>
          <span className="hidden sm:inline">CHARS: {stats?.chars || 0}</span>
          <span className="hidden md:inline">LANGS: {detectedLanguages.join(", ") || "AWAIT_FILE"}</span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <span className="opacity-60 hidden sm:inline">LATENCY: {stats?.latency || 0}MS</span>
          <span className="opacity-60">ENGINE_REF: {stats?.engine || "NEURAL_LITE"}</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${errorMessage ? "bg-red-500" : isAnalyzing ? "bg-amber-400 animate-ping" : "bg-green-500"}`} />
            <span>{errorMessage ? "SYS_ERR" : isAnalyzing ? "BUSY" : "SYS_OK"}</span>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
