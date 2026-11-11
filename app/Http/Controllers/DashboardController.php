<?php

namespace App\Http\Controllers;

use App\Enums\BlogStatus;
use App\Enums\ContactMessageStatus;
use App\Enums\PropertyStatus;
use App\Enums\ReferralStatus;
use App\Models\Blog;
use App\Models\ConstructionTask;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\Property;
use App\Models\Referral;
use App\Models\User;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => $this->stats(),
            'analytics' => $this->analytics(),
            'recentProperties' => $this->recentProperties(),
            'recentContacts' => $this->recentContacts(),
            'constructionHighlights' => $this->constructionHighlights(),
        ]);
    }

    /**
     * @return array<string, int|float>
     */
    private function stats(): array
    {
        $statusCounts = Property::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $avgProgress = (float) ConstructionTask::query()->avg('progress_percentage');

        return [
            'properties' => Property::query()->count(),
            'properties_published' => Property::query()->where('is_published', true)->count(),
            'properties_featured' => Property::query()->where('is_featured', true)->count(),
            'properties_draft' => (int) ($statusCounts[PropertyStatus::Draft->value] ?? 0),
            'properties_upcoming' => (int) ($statusCounts[PropertyStatus::Upcoming->value] ?? 0),
            'properties_ongoing' => (int) ($statusCounts[PropertyStatus::Ongoing->value] ?? 0),
            'properties_completed' => (int) ($statusCounts[PropertyStatus::Completed->value] ?? 0),
            'properties_sold_out' => (int) ($statusCounts[PropertyStatus::SoldOut->value] ?? 0),
            'contacts' => ContactMessage::query()->count(),
            'contacts_new' => ContactMessage::query()
                ->where('status', ContactMessageStatus::New)
                ->count(),
            'subscribers' => NewsletterSubscriber::query()->count(),
            'referrals' => Referral::query()->count(),
            'referrals_pending' => Referral::query()
                ->where('status', ReferralStatus::Pending)
                ->count(),
            'blogs' => Blog::query()->count(),
            'blogs_published' => Blog::query()
                ->where('status', BlogStatus::Published)
                ->count(),
            'users' => User::query()->count(),
            'construction_avg_progress' => round($avgProgress, 1),
        ];
    }

    /**
     * @return array{series: list<array<string, mixed>>, seriesKeys: list<string>}
     */
    private function analytics(): array
    {
        $days = 30;
        $start = now()->subDays($days - 1)->startOfDay();
        $series = $this->emptyDailySeries($start);

        $keys = ['properties', 'contacts', 'subscribers', 'referrals'];

        $this->mergeDailyCounts($series, Property::class, $start, 'properties');
        $this->mergeDailyCounts($series, ContactMessage::class, $start, 'contacts');
        $this->mergeDailyCounts($series, NewsletterSubscriber::class, $start, 'subscribers');
        $this->mergeDailyCounts($series, Referral::class, $start, 'referrals');

        return [
            'series' => array_values($series),
            'seriesKeys' => $keys,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentProperties(): array
    {
        return Property::query()
            ->with([
                'location:id,name,city',
                'propertyType:id,name',
            ])
            ->latest()
            ->limit(5)
            ->get(['id', 'location_id', 'property_type_id', 'title', 'status', 'is_published', 'is_featured', 'updated_at'])
            ->map(fn (Property $property): array => [
                'id' => $property->id,
                'title' => $property->title,
                'status' => $property->status?->value ?? $property->status,
                'is_published' => $property->is_published,
                'is_featured' => $property->is_featured,
                'updated_at' => $property->updated_at?->toIso8601String(),
                'location' => $property->location?->only(['id', 'name', 'city']),
                'property_type' => $property->propertyType?->only(['id', 'name']),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentContacts(): array
    {
        return ContactMessage::query()
            ->latest('created_at')
            ->limit(6)
            ->get(['id', 'first_name', 'last_name', 'email', 'subject', 'status', 'created_at'])
            ->map(fn (ContactMessage $message): array => [
                'id' => $message->id,
                'full_name' => trim("{$message->first_name} {$message->last_name}"),
                'email' => $message->email,
                'subject' => $message->subject,
                'status' => $message->status?->value ?? $message->status,
                'created_at' => $message->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function constructionHighlights(): array
    {
        return ConstructionTask::query()
            ->with('property:id,title')
            ->where('progress_percentage', '<', 100)
            ->orderByDesc('progress_percentage')
            ->limit(5)
            ->get(['id', 'property_id', 'title', 'status', 'progress_percentage'])
            ->map(fn (ConstructionTask $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status?->value ?? $task->status,
                'progress_percentage' => (float) $task->progress_percentage,
                'property' => $task->property?->only(['id', 'title']),
            ])
            ->all();
    }

    /**
     * @return array<string, array{date: string}>
     */
    private function emptyDailySeries(CarbonInterface $start): array
    {
        $series = [];

        foreach (CarbonPeriod::create($start, now()->endOfDay()) as $date) {
            $key = $date->toDateString();
            $series[$key] = ['date' => $key];
        }

        return $series;
    }

    /**
     * @param  array<string, array<string, mixed>>  $series
     * @param  class-string  $model
     */
    private function mergeDailyCounts(array &$series, string $model, CarbonInterface $start, string $key): void
    {
        $rows = $model::query()
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->where('created_at', '>=', $start)
            ->groupBy('day')
            ->pluck('total', 'day');

        foreach ($series as $day => &$point) {
            $point[$key] = (int) ($rows[$day] ?? 0);
        }
        unset($point);
    }
}
