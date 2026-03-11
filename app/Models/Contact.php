<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'names',
        'phone',
        'email',
        'gender',
        'contact_group_id',
    ];

    protected $casts = [
        'gender' => 'string',
    ];

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(ContactGroup::class, 'contact_group_maps', 'contact_id', 'contact_group_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ContactGroup::class, 'contact_group_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function surveys(): BelongsToMany
    {
        return $this->belongsToMany(Survey::class, 'contact_survey')
            ->withPivot([
                'sent_at',
                'invitation_dispatched_at',
                'sms_flow_state',
                'sms_flow_started_at',
                'sms_flow_completed_at',
            ])
            ->withTimestamps();
    }

    public function surveyResponses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function surveyMessages(): HasMany
    {
        return $this->hasMany(SurveyMessage::class);
    }
}
