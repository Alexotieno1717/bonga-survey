<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyMessage extends Model
{
    /** @use HasFactory<\Database\Factories\SurveyMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'contact_id',
        'direction',
        'phone',
        'delivery_status',
        'provider_message_id',
        'resolved_option_text',
        'message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
