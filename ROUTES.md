# HTTP Routes Summary

This document summarizes the main HTTP endpoints and their purposes. For full details, see route files under `routes/` and their controllers.

Legend: `[MW]` middleware; `[N]` named route.

## Public
- GET `/` → `Inertia::render('welcome')` [N: `home`]

## SMS Webhooks (public, CSRF disabled)
- GET|POST `/sms/incoming` → `SurveySmsWebhookController` [N: `sms.incoming.web`]
- GET|POST `/sms/webhook` → `SurveySmsWebhookController` [N: `sms.webhook.web`]

## Authenticated
- GET `/dashboard` → `DashboardController` [MW: `auth,verified`] [N: `dashboard`]

### Surveys
- GET `/surveys/question` → `SurveyController@index` [MW: `auth`] [N: `questions.index`]
- GET `/surveys/question/create` → `SurveyController@create` [MW: `auth`] [N: `questions.create`]
- POST `/surveys/question` → `SurveyController@store` [MW: `auth`] [N: `questions.store`]

AI assistance:
- GET `/surveys/ai` → `SurveyAiController@index` [MW: `auth`] [N: `surveys.ai.index`]
- POST `/surveys/ai` → `SurveyAiController@generate` [MW: `auth`] [N: `surveys.ai.generate`]
- POST `/surveys/ai/apply` → `SurveyAiController@apply` [MW: `auth`] [N: `surveys.ai.apply`]

Survey lifecycle and responses:
- GET `/surveys/responses` → `SurveyController@responsesIndex` [MW: `auth`] [N: `surveys.responses.index`]
- GET `/surveys/{survey}` → `SurveyController@show` [MW: `auth`] [N: `surveys.show`]
- PUT `/surveys/{survey}` → `SurveyController@updateDetails` [MW: `auth`] [N: `surveys.update`]
- PATCH `/surveys/{survey}/cancel` → `SurveyController@cancel` [MW: `auth`] [N: `surveys.cancel`]
- PATCH `/surveys/{survey}/reactivate` → `SurveyController@reactivate` [MW: `auth`] [N: `surveys.reactivate`]
- DELETE `/surveys/{survey}` → `SurveyController@destroy` [MW: `auth`] [N: `surveys.destroy`]
- GET `/surveys/{survey}/responses` → `SurveyController@responses` [MW: `auth`] [N: `surveys.responses`]
- GET `/surveys/{survey}/responses/{contact}` → `SurveyController@responseDetail` [MW: `auth`] [N: `surveys.responses.show`]

Questions under a survey:
- POST `/surveys/{survey}/questions` → `SurveyController@storeQuestion` [MW: `auth`] [N: `surveys.questions.store`]
- PUT `/surveys/{survey}/questions/{question}` → `SurveyController@updateQuestion` [MW: `auth`] [N: `surveys.questions.update`]

### Phonebook
Contacts:
- GET `/phonebook/contact` → `Phonebook\ContactController@index` [MW: `auth`] [N: `contact.index`]
- GET `/phonebook/contact/create` → `Phonebook\ContactController@create` [MW: `auth`] [N: `contact.create`]
- POST `/phonebook/contact` → `Phonebook\ContactController@store` [MW: `auth`] [N: `contact.store`]
- GET `/phonebook/contact/{contact}/edit` → `Phonebook\ContactController@edit` [MW: `auth`] [N: `contact.edit`]
- PUT `/phonebook/contact/{contact}` → `Phonebook\ContactController@update` [MW: `auth`] [N: `contact.update`]
- DELETE `/phonebook/contact/{contact}` → `Phonebook\ContactController@destroy` [MW: `auth`] [N: `contact.destroy`]

Contact Groups:
- GET `/phonebook/contactgroup` → `Phonebook\ContactGroupController@index` [MW: `auth`] [N: `contactgroup.index`]
- GET `/phonebook/contactgroup/create` → `Phonebook\ContactGroupController@create` [MW: `auth`] [N: `contactgroup.create`]
- POST `/phonebook/contactgroup` → `Phonebook\ContactGroupController@store` [MW: `auth`] [N: `contactgroup.store`]
- GET `/phonebook/contactgroup/{contactGroup}/edit` → `Phonebook\ContactGroupController@edit` [MW: `auth`] [N: `contactgroup.edit`]
- PUT `/phonebook/contactgroup/{contactGroup}` → `Phonebook\ContactGroupController@update` [MW: `auth`] [N: `contactgroup.update`]
- DELETE `/phonebook/contactgroup/{contactGroup}` → `Phonebook\ContactGroupController@destroy` [MW: `auth`] [N: `contactgroup.destroy`]

Contact Group Maps (Contact ↔ Group relationships):
- GET `/phonebook/contactgroupmaps` → `Phonebook\ContactGroupMapController@index` [MW: `auth`] [N: `contactgroupmaps.index`]
- GET `/phonebook/contactgroupmaps/create` → `Phonebook\ContactGroupMapController@create` [MW: `auth`] [N: `contactgroupmaps.create`]
- POST `/phonebook/contactgroupmaps` → `Phonebook\ContactGroupMapController@store` [MW: `auth`] [N: `contactgroupmaps.store`]
- GET `/phonebook/contactgroupmaps/{contactGroupMap}/edit` → `Phonebook\ContactGroupMapController@edit` [MW: `auth`] [N: `contactgroupmaps.edit`]
- PUT `/phonebook/contactgroupmaps/{contactGroupMap}` → `Phonebook\ContactGroupMapController@update` [MW: `auth`] [N: `contactgroupmaps.update`]
- DELETE `/phonebook/contactgroupmaps/{contactGroupMap}` → `Phonebook\ContactGroupMapController@destroy` [MW: `auth`] [N: `contactgroupmaps.destroy`]

### Settings (all require auth; destructive actions require verified)
- GET `/settings` → redirects to `/settings/profile`
- GET `/settings/profile` → `Settings\ProfileController@edit` [N: `profile.edit`]
- PATCH `/settings/profile` → `Settings\ProfileController@update` [N: `profile.update`]
- DELETE `/settings/profile` → `Settings\ProfileController@destroy` [MW: `verified`] [N: `profile.destroy`]

Password:
- GET `/settings/password` → `Settings\PasswordController@edit` [MW: `verified`] [N: `user-password.edit`]
- PUT `/settings/password` → `Settings\PasswordController@update` [MW: `verified`, `throttle:6,1`] [N: `user-password.update`]

Appearance:
- GET `/settings/appearance` → `Inertia::render('settings/appearance')` [MW: `verified`] [N: `appearance.edit`]

Two-Factor Authentication:
- GET `/settings/two-factor` → `Settings\TwoFactorAuthenticationController@show` [MW: `verified`] [N: `two-factor.show`]

## Frontend Route Helpers
- Wayfinder generates typed TS functions under `resources/js/routes/**` and controller invokers under `resources/js/actions/**`.
- Import examples:
  ```ts
  import { dashboard } from '@/routes/dashboard';
  import StoreSurvey from '@/actions/App/Http/Controllers/SurveyController';
  // Navigate or submit using these helpers
  ```
