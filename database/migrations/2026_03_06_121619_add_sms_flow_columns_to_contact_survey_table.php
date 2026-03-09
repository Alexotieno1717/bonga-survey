<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contact_survey', function (Blueprint $table) {
            $table->json('sms_flow_state')
                ->nullable()
                ->after('invitation_dispatched_at');
            $table->timestamp('sms_flow_started_at')
                ->nullable()
                ->after('sms_flow_state');
            $table->timestamp('sms_flow_completed_at')
                ->nullable()
                ->after('sms_flow_started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_survey', function (Blueprint $table) {
            $table->dropColumn([
                'sms_flow_state',
                'sms_flow_started_at',
                'sms_flow_completed_at',
            ]);
        });
    }
};
