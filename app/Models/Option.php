<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\OptionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Option extends Model
{
    /** @use HasFactory<OptionFactory> */
    use HasFactory;

    protected $fillable = ['question_id', 'option', 'order', 'branching'];

    protected $casts = [
        'branching' => 'array',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function responseAnswers(): HasMany
    {
        return $this->hasMany(SurveyResponseAnswer::class);
    }
}
