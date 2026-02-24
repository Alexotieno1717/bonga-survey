<?php

declare(strict_types=1);

namespace App\Http\Requests\Phonebook;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('contact_groups', 'name')->where(fn ($query) => $query->where('user_id', $this->user()->id)),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
