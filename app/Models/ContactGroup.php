<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'status',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    public function mappings(): HasMany
    {
        return $this->hasMany(ContactGroupMap::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
