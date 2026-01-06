'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Filter, BookOpen } from 'lucide-react';

interface ClassesFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    subjectFilter: string;
    onSubjectChange: (subject: string) => void;
    availableSubjects: string[];
}

export function ClassesFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    subjectFilter,
    onSubjectChange,
    availableSubjects,
}: ClassesFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search classes by name, subject, or grade..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="FULL">Full</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={onSubjectChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                            {subject}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
