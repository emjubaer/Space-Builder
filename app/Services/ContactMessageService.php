<?php

namespace App\Services;

use App\Enums\ContactMessageStatus;
use App\Models\ContactMessage;

class ContactMessageService
{
    /**
     * @param  array{first_name: string, last_name?: string|null, email: string, phone?: string|null, subject: string, message: string}  $data
     */
    public function create(array $data): ContactMessage
    {
        return ContactMessage::create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => ContactMessageStatus::New,
            'created_at' => now(),
        ]);
    }
}
