import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type PaginationMeta = {
    from?: number | null;
    to?: number | null;
    total?: number;
    current_page?: number;
    last_page?: number;
    per_page_options?: number[];
};

type Props = {
    meta?: PaginationMeta;
    rowsPerPage: number;
    setRowsPerPage: (value: number) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
};

const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

export default function Pagination({
    meta = {},
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
}: Props) {
    const from = meta.from ?? 0;
    const to = meta.to ?? 0;
    const total = meta.total ?? 0;
    const totalPages = meta.last_page ?? 1;
    const page = currentPage;
    const isLastPageDisabled = totalPages ? page >= totalPages : true;
    const perPageOptions =
        meta.per_page_options && meta.per_page_options.length > 0
            ? meta.per_page_options
            : DEFAULT_PER_PAGE_OPTIONS;

    return (
        <div className="flex items-center justify-between">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                Showing data {from} to {to} of {total} entries
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                    <Label
                        htmlFor="rows-per-page"
                        className="text-sm font-medium"
                    >
                        Rows per page
                    </Label>
                    <Select
                        value={String(rowsPerPage)}
                        onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-20"
                            id="rows-per-page"
                        >
                            <SelectValue>{rowsPerPage}</SelectValue>
                        </SelectTrigger>
                        <SelectContent side="top">
                            {perPageOptions.map((pageSize) => (
                                <SelectItem
                                    key={pageSize}
                                    value={`${pageSize}`}
                                >
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-fit items-center justify-center text-sm font-medium">
                    Page {page} of {totalPages}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                    <Button
                        variant="outline"
                        className="hidden size-8 p-0 lg:flex"
                        size="icon"
                        onClick={() => setCurrentPage(1)}
                        disabled={page === 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        className="size-8"
                        size="icon"
                        onClick={() => setCurrentPage(page - 1)}
                        disabled={page === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        className="size-8"
                        size="icon"
                        onClick={() => setCurrentPage(page + 1)}
                        disabled={isLastPageDisabled}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden size-8 lg:flex"
                        size="icon"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={isLastPageDisabled}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}
