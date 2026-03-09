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
            $table->timestamp('invitation_dispatched_at')
                ->nullable()
                ->after('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_survey', function (Blueprint $table) {
            $table->dropColumn('invitation_dispatched_at');
        });
    }
};
