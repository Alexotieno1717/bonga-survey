<?php

declare(strict_types=1);

namespace App\Http\Requests\Phonebook;

use App\Models\ContactGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactGroupRequest extends FormRequest
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
        /** @var ContactGroup $contactGroup */
        $contactGroup = $this->route('contactGroup');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('contact_groups', 'name')
                    ->where(fn ($query) => $query->where('user_id', $this->user()->id))
                    ->ignore($contactGroup->id),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
