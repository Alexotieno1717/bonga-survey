<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\OptionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Option extends Model
{
    /** @use HasFactory<OptionFactory> */
    use HasFactory;

    protected $fillable = ['question_id', 'option_text'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
