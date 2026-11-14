<?php

namespace App\Http\Controllers\Admin\Blog;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class BlogMediaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'alt' => ['nullable', 'string', 'max:255'],
            'compress' => ['sometimes', 'boolean'],
            'quality' => ['nullable', 'integer', 'min:40', 'max:100'],
            'max_width' => ['nullable', 'integer', 'min:320', 'max:4000'],
            'format' => ['nullable', 'in:webp,jpg,png'],
        ]);

        /** @var UploadedFile $image */
        $image = $validated['image'];
        $alt = isset($validated['alt']) ? trim((string) $validated['alt']) : '';
        $compress = $request->boolean('compress', true);
        $quality = (int) ($validated['quality'] ?? 80);
        $maxWidth = (int) ($validated['max_width'] ?? 1600);
        $format = $validated['format'] ?? 'webp';

        $path = $this->storeOptimizedImage(
            $image,
            $compress,
            $quality,
            $maxWidth,
            $format,
        );

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'name' => $image->getClientOriginalName(),
            'alt' => $alt !== '' ? $alt : null,
        ], 201);
    }

    private function storeOptimizedImage(
        UploadedFile $image,
        bool $compress,
        int $quality,
        int $maxWidth,
        string $format,
    ): string {
        $useQuality = $compress ? $quality : 90;
        $extension = $this->resolveExtension($format, $image);

        $processed = Image::decode($image);

        if ($processed->width() > $maxWidth) {
            $processed->scaleDown(width: $maxWidth);
        }

        $encoded = $processed->encodeUsingFileExtension($extension, quality: $useQuality);

        $filename = Str::uuid()->toString().'.'.$extension;
        $path = 'blog-editor/'.$filename;

        Storage::disk('public')->put($path, (string) $encoded);

        return $path;
    }

    private function resolveExtension(string $format, UploadedFile $image): string
    {
        if ($format === 'webp' && ! function_exists('imagewebp')) {
            return 'jpg';
        }

        if (in_array($format, ['webp', 'jpg', 'png'], true)) {
            return $format;
        }

        $original = strtolower($image->getClientOriginalExtension() ?: 'jpg');

        return in_array($original, ['jpg', 'jpeg', 'png', 'webp'], true)
            ? ($original === 'jpeg' ? 'jpg' : $original)
            : 'jpg';
    }
}
