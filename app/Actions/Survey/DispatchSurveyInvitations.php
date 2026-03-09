<?php

declare(strict_types=1);

namespace App\Actions\Survey;

use App\Models\Survey;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Log;

class DispatchSurveyInvitations
{
    public function __construct(
        private readonly SendSmsMessage $sendSmsMessage,
    ) {}

    /**
     * @return array{
     *     surveys: int,
     *     attempted: int,
     *     successful: int,
     *     failed: int
     * }
     */
    public function handle(?int $surveyId = null): array
    {
        $dispatchCutoff = now()->toDateTimeString();

        $surveyQuery = Survey::query()
            ->whereHas('contacts', function (Builder $query) use ($dispatchCutoff): void {
                $query->whereNotNull('contact_survey.sent_at')
                    ->whereNull('contact_survey.invitation_dispatched_at')
                    ->whereRaw("REPLACE(contact_survey.sent_at, 'T', ' ') <= ?", [$dispatchCutoff]);
            })
            ->with([
                'contacts' => function (BelongsToMany $query) use ($dispatchCutoff): void {
                    $query->whereNotNull('contact_survey.sent_at')
                        ->whereNull('contact_survey.invitation_dispatched_at')
                        ->whereRaw("REPLACE(contact_survey.sent_at, 'T', ' ') <= ?", [$dispatchCutoff]);
                },
            ]);

        if ($surveyId !== null) {
            $surveyQuery->whereKey($surveyId);
        }

        $surveys = $surveyQuery->get();

        $attempted = 0;
        $successful = 0;
        $failed = 0;

        foreach ($surveys as $survey) {
            $invitationMessage = trim((string) $survey->invitation_message);

            foreach ($survey->contacts as $contact) {
                if ($invitationMessage === '') {
                    $failed++;

                    continue;
                }

                $attempted++;

                $result = $this->sendSmsMessage->handle(
                    phoneNumber: (string) $contact->phone,
                    message: $invitationMessage,
                );

                if (! $result['successful']) {
                    $failed++;

                    if ($result['status_message'] !== 'SMS gateway credentials are not configured.') {
                        Log::warning('Failed to dispatch survey invitation SMS.', [
                            'survey_id' => $survey->id,
                            'contact_id' => $contact->id,
                            'phone' => $contact->phone,
                            'status' => $result['status'],
                            'status_message' => $result['status_message'],
                        ]);
                    }

                    continue;
                }

                $successful++;
                $survey->contacts()->updateExistingPivot($contact->id, [
                    'invitation_dispatched_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return [
            'surveys' => $surveys->count(),
            'attempted' => $attempted,
            'successful' => $successful,
            'failed' => $failed,
        ];
    }
}
