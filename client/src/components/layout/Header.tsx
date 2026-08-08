import { Search, Globe, ChevronDown, Eye, ZoomIn, ZoomOut, Calendar, Loader2, CheckCircle2, User } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export default function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleVerification = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setIsVerifying(true);
      setIsVerified(false);
      setTimeout(() => {
        setIsVerifying(false);
        setIsVerified(true);
      }, 3000);
    } else {
      setIsVerifying(false);
      setIsVerified(false);
    }
  };

  useEffect(() => {
    const updateDate = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(date.toLocaleDateString('ar-SA', options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-white font-sans">
      {/* Top Bar - Gray Background */}
      <div className="bg-[#f5f5f5] border-b border-gray-200 py-2">
        <div className="container flex justify-between items-center h-8">
          {/* Right Side: Gov Info */}
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Saudi_Arabia.svg/800px-Flag_of_Saudi_Arabia.svg.png" alt="Saudi Flag" className="w-6 h-4 object-cover border border-gray-200" />
            <span className="text-[10px] md:text-xs text-gray-800 font-medium">موقع حكومي رسمي تابع لحكومة المملكة العربية السعودية</span>
            
            <Popover open={isOpen} onOpenChange={handleVerification}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-[10px] md:text-xs text-[#006C35] font-medium hover:underline outline-none">
                  كيف تتحقق
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="flex flex-col items-center justify-center min-h-[40px] gap-1">
                  {isVerifying ? (
                    <Loader2 className="w-8 h-8 text-[#006C35] animate-spin" />
                  ) : isVerified ? (
                    <div className="flex items-center gap-2 text-[#006C35] font-bold text-sm animate-in fade-in zoom-in duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>هذا الموقع الحكومي آمن</span>
                    </div>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Left Side: Date & Tools */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{currentDate}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-3 text-[#006C35] border-l border-gray-300 pl-4 ml-2 h-4">
              <button title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
              <button title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
              <button title="High Contrast"><Eye className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar - White Background */}
      <div className="container py-5">
        <div className="flex justify-between items-center">
          
          {/* Right: Logo & Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/images/gov_sa_logo.png" 
                alt="GOV.SA Logo" 
                className="h-12 object-contain"
              />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700">
              <button className="flex items-center gap-1 hover:text-[#006C35]">
                عن المملكة
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <button className="flex items-center gap-1 hover:text-[#006C35]">
                الجهات
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <button className="flex items-center gap-1 hover:text-[#006C35]">
                الخدمات
              </button>
              <button className="flex items-center gap-1 hover:text-[#006C35]">
                المشاركة
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <button className="flex items-center gap-1 hover:text-[#006C35]">
                نهتم بكم
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <button className="flex items-center gap-1 hover:text-[#006C35]">
                عن المنصة
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            </nav>
          </div>

          {/* Left: Actions & Vision Logo */}
          <div className="flex items-center gap-6">
            <button className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-[#006C35]">
              <Search className="w-5 h-5" />
              البحث
            </button>
            
            <button className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-[#006C35]">
              <Globe className="w-5 h-5" />
              English
            </button>


            
            <div className="w-[1px] h-8 bg-gray-200 mx-2 hidden lg:block"></div>

            {/* Vision 2030 Logo - Desktop */}
            <div className="hidden lg:block">
              <img 
                src="/images/vision_2030_logo.png" 
                alt="Saudi Vision 2030" 
                className="h-16 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Mobile Header Elements (Vision 2030 + English) */}
            <div className="flex lg:hidden items-center gap-3">
              <button className="flex items-center gap-1 text-xs font-medium text-gray-800 hover:text-[#006C35]">
                English
                <Globe className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-6 bg-gray-200"></div>
              <img 
                src="/images/vision2030-hq.png" 
                alt="Saudi Vision 2030" 
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Bar - Green Background */}
      <div className="bg-[#006C35] py-5">
        <div className="container flex items-center justify-between gap-2 text-sm text-white font-medium">
          <div className="flex items-center gap-2">
          <Link href="/" className="hover:opacity-80">الرئيسية</Link>
          <span className="opacity-60">&gt;</span>
          <span>الخدمات</span>
          </div>
          {/* Mobile Search Bar */}
          <div className="md:hidden w-1/2 max-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="w-full h-8 pr-8 pl-3 text-xs text-gray-800 bg-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
