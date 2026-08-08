import React from 'react';
import { cn } from "@/lib/utils";
import { 
  Briefcase, 
  Building2, 
  FileText, 
  LayoutDashboard, 
  Settings,
  ChevronDown,
  ChevronLeft
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  hasSubmenu?: boolean;
  isOpen?: boolean;
}

const SidebarItem = ({ icon, label, isActive, hasSubmenu, isOpen }: SidebarItemProps) => {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 cursor-pointer transition-colors rounded-md mb-1",
      isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
    )}>
      <div className="flex items-center gap-3">
        <span className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-500")}>
          {icon}
        </span>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {hasSubmenu && (
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "")} />
      )}
    </div>
  );
};

interface SBCSidebarProps {
  serviceName?: string;
}

export const SBCSidebar = ({ serviceName = 'تحديث بيانات الخدمة' }: SBCSidebarProps) => {
  return (
    <div className="w-64 bg-white border-l border-gray-200 h-full min-h-screen p-4 hidden lg:block">
      <div className="mb-6">
        <h2 className="text-gray-500 text-xs font-semibold mb-4 px-2">الخدمات الإلكترونية</h2>
        
        <div className="space-y-1">
          <SidebarItem 
            icon={<Building2 />} 
            label="بدء الأعمال" 
            isActive={true}
            hasSubmenu={true}
            isOpen={true}
          />
          
          <div className="pr-9 space-y-1 mb-4">
            <div className="text-sm text-blue-600 font-medium py-1 cursor-pointer">{serviceName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SBCSidebar;
