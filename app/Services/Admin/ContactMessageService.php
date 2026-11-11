<?php

namespace App\Services\Admin;

use App\Enums\ContactMessageStatus;
use App\Models\ContactMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ContactMessageService
{
    /**
     * @return LengthAwarePaginator<int, ContactMessage>
     */
    public function paginate(Request $request): LengthAwarePaginator
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        return ContactMessage::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest('created_at')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));
    }

    public function markInProgressIfNew(ContactMessage $message): ContactMessage
    {
        if ($message->status === ContactMessageStatus::New) {
            $message->update(['status' => ContactMessageStatus::InProgress]);
        }

        return $message->refresh();
    }

    public function updateStatus(ContactMessage $message, ContactMessageStatus $status): ContactMessage
    {
        $message->update(['status' => $status]);

        return $message->refresh();
    }

    public function delete(ContactMessage $message): void
    {
        $message->delete();
    }
}
