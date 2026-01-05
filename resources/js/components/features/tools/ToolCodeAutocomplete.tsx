import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface ToolOption {
    unit_code: string;
    tool_name: string;
    available_stock: number;
    tool_id: number;
}

interface ToolCodeAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (tool: ToolOption) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function ToolCodeAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Masukkan kode atau nama alat...',
    disabled = false,
    className,
}: ToolCodeAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<ToolOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Debounce search
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (value.trim().length < 1) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        timeoutRef.current = setTimeout(() => {
            searchTools(value.trim());
        }, 300);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const searchTools = async (query: string) => {
        setIsLoading(true);
        try {
            const response = await axios.get('/tool-loans/search-tools', {
                params: { query },
            });
            if (response.data.success) {
                setSuggestions(response.data.tools);
                setIsOpen(response.data.tools.length > 0);
                setSelectedIndex(-1);
            }
        } catch (error) {
            console.error('Error searching tools:', error);
            setSuggestions([]);
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (tool: ToolOption) => {
        onChange(tool.unit_code);
        onSelect(tool);
        setIsOpen(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-9"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="max-h-60 overflow-auto p-1">
                        {suggestions.map((tool, index) => (
                            <div
                                key={`${tool.tool_id}-${tool.unit_code}`}
                                onClick={() => handleSelect(tool)}
                                className={cn(
                                    'flex cursor-pointer flex-col gap-1 rounded-sm px-3 py-2 text-sm transition-colors',
                                    index === selectedIndex
                                        ? 'bg-accent text-accent-foreground'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{tool.unit_code}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Stok: {tool.available_stock}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">{tool.tool_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

