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
        Schema::table('survey_messages', function (Blueprint $table) {
            $table->string('provider_message_id', 64)->nullable();
            $table->json('payload')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_messages', function (Blueprint $table) {
            $table->dropColumn(['provider_message_id', 'payload']);
        });
    }
};
