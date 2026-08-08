import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function FeedbackComponent() {
  const [selectedOption, setSelectedOption] = useState<"yes" | "no" | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-3 w-full">
        <span className="text-base font-bold text-gray-800">هل أعجبك محتوى الصفحة ؟</span>
        
        {isSubmitted ? (
          <div className="flex items-center gap-2 text-[#198754] font-bold animate-in fade-in duration-300">
            <Check className="w-5 h-5" />
            <span>تم الإرسال</span>
          </div>
        ) : (
          <div className="flex items-center gap-16">
            <div className="flex gap-12">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setSelectedOption("yes")}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedOption === "yes" ? "border-[#198754] bg-[#198754]" : "border-gray-300 bg-white group-hover:border-[#198754]"}`}
                >
                  {selectedOption === "yes" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <span className={`text-sm font-bold ${selectedOption === "yes" ? "text-[#198754]" : "text-gray-700 group-hover:text-[#198754]"}`}>نعم</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setSelectedOption("no")}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedOption === "no" ? "border-[#198754] bg-[#198754]" : "border-gray-300 bg-white group-hover:border-[#198754]"}`}
                >
                  {selectedOption === "no" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <span className={`text-sm font-bold ${selectedOption === "no" ? "text-[#198754]" : "text-gray-700 group-hover:text-[#198754]"}`}>لا</span>
              </label>
            </div>
            
            {selectedOption && (
              <Button 
                onClick={handleSubmit}
                className="bg-[#198754] hover:bg-[#157347] text-white px-4 h-8 text-xs font-bold rounded animate-in fade-in slide-in-from-right-4 duration-300"
              >
                إرسال
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-600 font-medium flex items-center gap-1 w-full justify-start">
        <span className="font-bold text-[#006C35]">3</span>
        من الزوّار للموقع أعجبهم محتوى هذه الصفحة
      </div>
    </div>
  );
}
