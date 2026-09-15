"use client";

import { useState, useMemo, memo } from "react";
import { ChevronRight, ChevronDown, Folder, FileCode, FileJson, FileText, Search } from "lucide-react";
import clsx from "clsx";
import { FileSystemItem } from "@/lib/fileUtils";

const FileIcon = ({ name, type }: { name: string; type: "folder" | "file" }) => {
    if (type === "folder") return <Folder className="w-4 h-4 text-neon-purple fill-neon-purple/20" />;

    // Improved extension detection
    const ext = name.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'tsx':
        case 'ts':
            return <FileCode className="w-4 h-4 text-blue-400" />;
        case 'js':
        case 'jsx':
            return <FileCode className="w-4 h-4 text-yellow-400" />;
        case 'json':
            return <FileJson className="w-4 h-4 text-orange-400" />;
        case 'css':
        case 'scss':
            return <FileCode className="w-4 h-4 text-pink-400" />;
        case 'py':
            return <FileCode className="w-4 h-4 text-blue-300" />;
        case 'cpp':
        case 'c':
        case 'h':
            return <FileCode className="w-4 h-4 text-red-500" />;
        case 'java':
            return <FileCode className="w-4 h-4 text-orange-600" />;
        case 'go':
            return <FileCode className="w-4 h-4 text-cyan-500" />;
        case 'md':
            return <FileText className="w-4 h-4 text-gray-300" />;
        default:
            return <FileText className="w-4 h-4 text-gray-400" />;
    }
};

const FileTreeNode = memo(({ item, level, onSelect, selectedId }: { item: FileSystemItem, level: number, onSelect: (id: string) => void, selectedId: string | null }) => {
    const [isOpen, setIsOpen] = useState(false); // Default closed for cleaner look except root
    const isSelected = item.id === selectedId;

    // Separate folders and files for sorting
    const children = item.children || [];
    const sortedChildren = useMemo(() => {
        return [...children].sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
    }, [children]);

    return (
        <div>
            <div
                className={clsx(
                    "flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors text-sm rounded-md",
                    isSelected ? "bg-neon-cyan/10 text-neon-cyan border-l-2 border-neon-cyan" : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => {
                    if (item.type === "folder") setIsOpen(!isOpen);
                    else onSelect(item.id);
                }}
            >
                {item.type === "folder" ? (
                    <span className="text-gray-500">
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                ) : <span className="w-3" />} {/* Spacer */}

                <FileIcon name={item.name} type={item.type} />
                <span className="truncate">{item.name}</span>
            </div>

            {isOpen && sortedChildren.length > 0 && (
                <div className="overflow-hidden">
                    {sortedChildren.map((child, index) => (
                        <FileTreeNode
                            key={`${child.id}-${index}`}
                            item={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
FileTreeNode.displayName = "FileTreeNode";

export default function FileTree({ data, onSelect }: { data: FileSystemItem, onSelect: (id: string) => void }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSelect = (id: string) => {
        setSelectedId(id);
        onSelect(id);
    }

    return (
        <div className="h-full flex flex-col bg-[#050505] border-r border-white/10">
            <div className="p-4 border-b border-white/10">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-neon-cyan outline-none transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
                {/* Render children of root sorted: folders first, then files */}
                {useMemo(() => {
                    return [...(data.children || [])].sort((a, b) => {
                        if (a.type === b.type) return a.name.localeCompare(b.name);
                        return a.type === 'folder' ? -1 : 1;
                    });
                }, [data.children]).map((child, index) => (
                    <FileTreeNode
                        key={`${child.id}-${index}`}
                        item={child}
                        level={0}
                        onSelect={handleSelect}
                        selectedId={selectedId}
                    />
                ))}
            </div>
        </div>
    );
}
