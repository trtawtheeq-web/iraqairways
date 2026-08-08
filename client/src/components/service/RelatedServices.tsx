import { FileText, HelpCircle, Download } from "lucide-react";

export default function RelatedServices() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <a href="#" className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">الأسئلة الشائعة</h3>
        <p className="text-xs text-gray-500">إجابات على استفساراتك المتكررة حول الخدمة</p>
      </a>
      
      <a href="#" className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-50 text-[#006C35] flex items-center justify-center group-hover:bg-[#006C35] group-hover:text-white transition-colors">
          <Download className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">دليل المستخدم</h3>
        <p className="text-xs text-gray-500">شرح مفصل لطريقة استخدام الخدمة خطوة بخطوة</p>
      </a>
      
      <a href="#" className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">المتطلبات والمستندات</h3>
        <p className="text-xs text-gray-500">قائمة بجميع المستندات المطلوبة لإتمام الخدمة</p>
      </a>
    </div>
  );
}
