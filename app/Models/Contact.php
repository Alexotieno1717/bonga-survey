<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Contact extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'names',
        'phone',
        'email',
        'gender',
    ];

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(ContactGroup::class, 'contact_groups_maps', 'contact_id', 'group_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ContactGroup::class, 'contact_group_id');
    }


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
