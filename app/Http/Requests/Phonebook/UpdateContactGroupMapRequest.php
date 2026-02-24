<?php

declare(strict_types=1);

namespace App\Http\Requests\Phonebook;

use App\Models\ContactGroupMap;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactGroupMapRequest extends FormRequest
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
        /** @var ContactGroupMap $contactGroupMap */
        $contactGroupMap = $this->route('contactGroupMap');

        return [
            'contact_id' => [
                'required',
                Rule::exists('contacts', 'id')->where(fn ($query) => $query->where('user_id', $this->user()->id)),
                Rule::unique('contact_group_maps', 'contact_id')
                    ->where(fn ($query) => $query->where('contact_group_id', $this->input('contact_group_id')))
                    ->ignore($contactGroupMap->id),
            ],
            'contact_group_id' => [
                'required',
                Rule::exists('contact_groups', 'id')->where(fn ($query) => $query->where('user_id', $this->user()->id)),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'contact_id.unique' => 'This contact is already mapped to the selected group.',
        ];
    }
}
