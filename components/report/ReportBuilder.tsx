"use client";

import { Reorder } from "framer-motion";
import { GripVertical, Eye, EyeOff } from "lucide-react";

export type ReportSection = {
    id: string;
    title: string;
    isVisible: boolean;
};

export default function ReportBuilder({ sections, onToggle, onReorder }: {
    sections: ReportSection[],
    onToggle: (id: string) => void,
    onReorder: (sections: ReportSection[]) => void
}) {
    return (
        <div className="space-y-4 p-4 bg-[#111] border rounded-xl border-white/10 h-full">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Report Sections</h3>

            <Reorder.Group axis="y" values={sections} onReorder={onReorder} className="space-y-2">
                {sections.map((section) => (
                    <Reorder.Item
                        key={section.id}
                        value={section}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${section.isVisible ? "bg-white/5 border-white/10" : "bg-white/2 opacity-50 border-transparent"}`}
                    >
                        <div className="cursor-grab active:cursor-grabbing hover:text-white text-gray-500">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-sm font-medium">{section.title}</span>
                        <button
                            onClick={() => onToggle(section.id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white"
                        >
                            {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
}
