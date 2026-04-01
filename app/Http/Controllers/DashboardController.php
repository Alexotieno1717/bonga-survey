<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Survey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
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

        $aiSurveys = Survey::query()
            ->where('created_by', $userId)
            ->where('created_with_ai', true)
            ->count();

        $manualSurveys = Survey::query()
            ->where('created_by', $userId)
            ->where(function ($query): void {
                $query->whereNull('created_with_ai')
                    ->orWhere('created_with_ai', false);
            })
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
            ->map(fn (Survey $survey): array => [
                'id' => $survey->id,
                'name' => $survey->name,
                'status' => $survey->status,
                'created_at' => $survey->created_at?->toDateTimeString(),
                'contacts_count' => $survey->contacts_count,
                'created_with_ai' => (bool) $survey->created_with_ai,
            ]);

        $smsDriver = (string) Config::get('services.sms.driver', 'http');
        $smsOutbox = $smsDriver === 'log'
            ? $this->readLocalSmsOutbox()
            : [];

        return Inertia::render('dashboard', [
            'surveyStats' => [
                'total' => $totalSurveys,
                'draft' => $draftSurveys,
                'active' => $activeSurveys,
                'completed' => $completedSurveys,
            ],
            'surveyCreationStats' => [
                'ai' => $aiSurveys,
                'manual' => $manualSurveys,
            ],
            'statusChart' => $statusChart,
            'recentSurveys' => $recentSurveys,
            'smsDriver' => $smsDriver,
            'smsOutbox' => $smsOutbox,
        ]);
    }

    /**
     * @return array<int, array{sent_at: string, phone: string, message: string}>
     */
    private function readLocalSmsOutbox(): array
    {
        $logPath = storage_path('logs/laravel.log');
        if (! is_file($logPath) || ! is_readable($logPath)) {
            return [];
        }

        $lines = $this->readLogTailLines($logPath, 200, 262144);
        $messages = [];

        foreach (array_reverse($lines) as $line) {
            if (! str_contains($line, 'SMS message logged locally.')) {
                continue;
            }

            $timestamp = $this->extractLogTimestamp($line);
            $context = $this->extractLogContext($line);

            if (! is_array($context)) {
                continue;
            }

            $phone = $context['phone'] ?? null;
            $message = $context['message'] ?? null;

            if (! is_string($phone) || ! is_string($message)) {
                continue;
            }

            $messages[] = [
                'sent_at' => $timestamp ?? '',
                'phone' => $phone,
                'message' => $message,
            ];

            if (count($messages) >= 10) {
                break;
            }
        }

        return $messages;
    }

    /**
     * @return array<int, string>
     */
    private function readLogTailLines(string $path, int $maxLines, int $maxBytes): array
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return [];
        }

        $fileSize = filesize($path);
        if (! is_int($fileSize) || $fileSize <= 0) {
            fclose($handle);

            return [];
        }

        $seek = max(0, $fileSize - $maxBytes);
        fseek($handle, $seek);
        $buffer = stream_get_contents($handle);
        fclose($handle);

        if (! is_string($buffer) || $buffer === '') {
            return [];
        }

        if ($seek > 0) {
            $firstNewline = strpos($buffer, "\n");
            if ($firstNewline !== false) {
                $buffer = substr($buffer, $firstNewline + 1);
            }
        }

        $lines = preg_split('/\r?\n/', trim($buffer));
        if (! is_array($lines)) {
            return [];
        }

        if (count($lines) > $maxLines) {
            $lines = array_slice($lines, -$maxLines);
        }

        return array_values($lines);
    }

    private function extractLogTimestamp(string $line): ?string
    {
        if (preg_match('/^\[([^\]]+)\]/', $line, $matches) !== 1) {
            return null;
        }

        return $matches[1] ?? null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function extractLogContext(string $line): ?array
    {
        $contextPos = strrpos($line, '{');
        if ($contextPos === false) {
            return null;
        }

        $context = substr($line, $contextPos);
        if (! is_string($context) || $context === '') {
            return null;
        }

        $decoded = json_decode($context, true);

        return is_array($decoded) ? $decoded : null;
    }
}
