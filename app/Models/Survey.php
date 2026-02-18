<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\SurveyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Survey extends Model
{
    /** @use HasFactory<SurveyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'invitation_message',
        'completion_message',
        'trigger_word',
        'start_date',
        'end_date',
    ];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(Contact::class, 'contact_survey')
            ->withPivot('sent_at')
            ->withTimestamps();
    }
}
