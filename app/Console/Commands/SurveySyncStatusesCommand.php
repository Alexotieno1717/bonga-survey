<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Survey;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class SurveySyncStatusesCommand extends Command
{
    protected $signature = 'surveys:sync-statuses';

    protected $description = 'Sync survey statuses based on publish state and survey dates.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = now()->toDateString();

        $activated = Survey::query()
            ->where('status', 'draft')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->whereHas('contacts', function (Builder $query): void {
                $query->whereNotNull('contact_survey.sent_at');
            })
            ->update([
                'status' => 'active',
                'updated_at' => now(),
            ]);

        $completed = Survey::query()
            ->whereIn('status', ['draft', 'active'])
            ->whereDate('end_date', '<', $today)
            ->whereHas('contacts', function (Builder $query): void {
                $query->whereNotNull('contact_survey.sent_at');
            })
            ->update([
                'status' => 'completed',
                'updated_at' => now(),
            ]);

        $this->info("Surveys activated: {$activated}");
        $this->info("Surveys completed: {$completed}");

        return self::SUCCESS;
    }
}
