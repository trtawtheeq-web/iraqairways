import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

interface CommentModalProps {
  trigger: React.ReactNode;
}

export default function CommentModal({ trigger }: CommentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    captcha: ""
  });

  const handleSubmit = () => {
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      // Reset form after showing success message for a while or keep it shown
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setFormData({ name: "", email: "", message: "", captcha: "" });
      }, 2000);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" showCloseButton={false}>
        {isSubmitted ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#198754]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#198754]">تم إرسال تعليقك</h3>
            <p className="text-gray-500">شكراً لمشاركتنا رأيك.</p>
          </div>
        ) : (
          <div className="p-8" dir="rtl">
            <DialogHeader className="mb-6 text-right">
              <DialogTitle className="text-[#198754] text-xl font-bold mb-2 text-right">التعليقات والاقتراحات</DialogTitle>
              <p className="text-gray-800 font-bold text-base text-right">ماذا تريد أن تخبرنا ؟</p>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex gap-1">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="الاسم" 
                    className="text-right h-10 border-gray-300 focus:border-[#198754] focus:ring-[#198754]"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex gap-1">
                    ايميل <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="ايميل" 
                    className="text-right h-10 border-gray-300 focus:border-[#198754] focus:ring-[#198754]"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex gap-1">
                  الرسالة <span className="text-red-500">*</span>
                </label>
                <Textarea 
                  placeholder="الرسالة" 
                  className="min-h-[100px] text-right border-gray-300 focus:border-[#198754] focus:ring-[#198754] resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center gap-2">
                  <div className="border border-gray-300 rounded p-2 bg-gray-50 select-none relative overflow-hidden w-[150px] h-[40px] flex items-center justify-center">
                    <span className="font-mono text-lg tracking-widest italic font-bold text-gray-600" style={{textDecoration: 'line-through'}}>wqgdji</span>
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'linear-gradient(45deg, transparent 25%, #000 25%, #000 50%, transparent 50%, transparent 75%, #000 75%, #000 100%)', backgroundSize: '10px 10px'}}></div>
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 border-gray-300">
                    <RefreshCw className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
                <Input 
                  placeholder="أدخل رمز التحقق" 
                  className="w-[150px] text-right h-10 border-gray-300 focus:border-[#198754] focus:ring-[#198754]"
                  value={formData.captcha}
                  onChange={(e) => setFormData({...formData, captcha: e.target.value})}
                />
              </div>

              <div className="flex justify-start gap-3 pt-4">
                <Button 
                  onClick={handleSubmit}
                  className="bg-[#198754] hover:bg-[#157347] text-white px-8 h-10 text-sm font-bold rounded"
                >
                  إرسال
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="border-gray-300 text-gray-700 px-8 h-10 text-sm font-bold rounded hover:bg-gray-50"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
