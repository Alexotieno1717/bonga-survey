<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Survey\DispatchSurveyInvitations;
use Illuminate\Console\Command;

class SendSurveyInvitationsCommand extends Command
{
    protected $signature = 'surveys:send-invitations {--survey= : Dispatch invitations for a single survey id}';

    protected $description = 'Dispatch due survey invitation SMS messages.';

    public function __construct(
        private readonly DispatchSurveyInvitations $dispatchSurveyInvitations,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $surveyOption = $this->option('survey');
        $surveyId = is_numeric($surveyOption) ? (int) $surveyOption : null;

        $result = $this->dispatchSurveyInvitations->handle($surveyId);

        $this->info("Surveys checked: {$result['surveys']}");
        $this->info("Invitations attempted: {$result['attempted']}");
        $this->info("Invitations sent: {$result['successful']}");
        $this->info("Invitations failed: {$result['failed']}");

        return self::SUCCESS;
    }
}
