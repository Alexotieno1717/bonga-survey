<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'sms' => [
        'url' => env('SMS_GATEWAY_URL', 'http://167.172.14.50:4002/v1/send-sms'),
        'client_id' => env('SMS_GATEWAY_CLIENT_ID'),
        'key' => env('SMS_GATEWAY_KEY'),
        'secret' => env('SMS_GATEWAY_SECRET'),
        'service_id' => env('SMS_GATEWAY_SERVICE_ID'),
        'timeout' => (int) env('SMS_GATEWAY_TIMEOUT', 15),
        'retry_attempts' => (int) env('SMS_GATEWAY_RETRY_ATTEMPTS', 3),
        'retry_base_delay_ms' => (int) env('SMS_GATEWAY_RETRY_BASE_DELAY_MS', 300),
    ],

];
