<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\QuestionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    /** @use HasFactory<QuestionFactory> */
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'question',
        'response_type',
        'free_text_description',
        'allow_multiple',
        'order',
        'branching',
    ];

    protected $casts = [
        'branching' => 'array',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(Option::class)->orderBy('order');
    }
}
