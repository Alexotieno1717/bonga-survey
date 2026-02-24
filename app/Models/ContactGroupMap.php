<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactGroupMap extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'contact_id',
        'contact_group_id',
        'group',
        'phone',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function contactGroup(): BelongsTo
    {
        return $this->belongsTo(ContactGroup::class);
    }
}
