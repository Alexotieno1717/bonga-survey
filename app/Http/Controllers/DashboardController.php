<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Survey;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $userId = $request->user()->id;

        $totalSurveys = Survey::query()
            ->where('created_by', $userId)
            ->count();

        $draftSurveys = Survey::query()
            ->where('created_by', $userId)
            ->where('status', 'draft')
            ->count();

        $activeSurveys = Survey::query()
            ->where('created_by', $userId)
            ->where('status', 'active')
            ->count();

        $completedSurveys = Survey::query()
            ->where('created_by', $userId)
            ->where('status', 'completed')
            ->count();

        $statusChart = [
            ['label' => 'Draft', 'key' => 'draft', 'value' => $draftSurveys],
            ['label' => 'Active', 'key' => 'active', 'value' => $activeSurveys],
            ['label' => 'Completed', 'key' => 'completed', 'value' => $completedSurveys],
        ];

        $recentSurveys = Survey::query()
            ->where('created_by', $userId)
            ->withCount('contacts')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function (Survey $survey): array {
                return [
                    'id' => $survey->id,
                    'name' => $survey->name,
                    'status' => $survey->status,
                    'created_at' => $survey->created_at?->toDateTimeString(),
                    'contacts_count' => $survey->contacts_count,
                ];
            });

        return Inertia::render('dashboard', [
            'surveyStats' => [
                'total' => $totalSurveys,
                'draft' => $draftSurveys,
                'active' => $activeSurveys,
                'completed' => $completedSurveys,
            ],
            'statusChart' => $statusChart,
            'recentSurveys' => $recentSurveys,
        ]);
    }
}
