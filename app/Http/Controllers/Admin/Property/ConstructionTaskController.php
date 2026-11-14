<?php

namespace App\Http\Controllers\Admin\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Property\ConstructionTask\StoreConstructionTaskRequest;
use App\Http\Requests\Admin\Property\ConstructionTask\UpdateConstructionTaskProgressRequest;
use App\Http\Requests\Admin\Property\ConstructionTask\UpdateConstructionTaskRequest;
use App\Http\Resources\Admin\Property\ConstructionTaskResource;
use App\Models\ConstructionTask;
use App\Models\Property;
use App\Services\Admin\ConstructionTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ConstructionTaskController extends Controller
{
    public function __construct(private ConstructionTaskService $tasks) {}

    public function index(Property $property): AnonymousResourceCollection
    {
        return ConstructionTaskResource::collection(
            $this->tasks->listForProperty($property),
        );
    }

    public function store(StoreConstructionTaskRequest $request, Property $property): JsonResponse
    {
        $task = $this->tasks->create($property, $request->validated());

        return response()->json([
            'message' => __('Construction task created successfully.'),
            'task' => (new ConstructionTaskResource($task))->resolve(),
        ], 201);
    }

    public function update(
        UpdateConstructionTaskRequest $request,
        Property $property,
        ConstructionTask $constructionTask,
    ): JsonResponse {
        $this->ensureBelongsToProperty($property, $constructionTask);

        $task = $this->tasks->update($constructionTask, $request->validated());

        return response()->json([
            'message' => __('Construction task updated successfully.'),
            'task' => (new ConstructionTaskResource($task))->resolve(),
        ]);
    }

    public function updateProgress(
        UpdateConstructionTaskProgressRequest $request,
        Property $property,
        ConstructionTask $constructionTask,
    ): JsonResponse {
        $this->ensureBelongsToProperty($property, $constructionTask);

        $task = $this->tasks->updateProgress($constructionTask, $request->validated());

        return response()->json([
            'message' => __('Progress updated successfully.'),
            'task' => (new ConstructionTaskResource($task))->resolve(),
        ]);
    }

    public function destroy(Property $property, ConstructionTask $constructionTask): JsonResponse
    {
        $this->ensureBelongsToProperty($property, $constructionTask);

        $this->tasks->delete($constructionTask);

        return response()->json([
            'message' => __('Construction task deleted successfully.'),
        ]);
    }

    public function applyDefaults(Property $property): JsonResponse
    {
        $tasks = $this->tasks->applyDefaults($property);

        return response()->json([
            'message' => __('Default construction phases applied.'),
            'tasks' => ConstructionTaskResource::collection($tasks)->resolve(),
        ]);
    }

    private function ensureBelongsToProperty(Property $property, ConstructionTask $task): void
    {
        if ($task->property_id !== $property->id) {
            throw new NotFoundHttpException;
        }
    }
}
