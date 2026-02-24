<?php

declare(strict_types=1);

namespace App\Http\Requests\Phonebook;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
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
            'names' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50', 'unique:contacts,phone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:contacts,email'],
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'contact_group_id' => [
                'nullable',
                Rule::exists('contact_groups', 'id')->where(function ($query): void {
                    $query->where('user_id', $this->user()->id);
                }),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'contact_group_id.exists' => 'Selected contact group is invalid for your account.',
        ];
    }
}
