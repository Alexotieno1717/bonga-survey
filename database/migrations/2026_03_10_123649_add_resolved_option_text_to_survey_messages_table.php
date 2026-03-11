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
            $table->string('resolved_option_text')->nullable()->after('delivery_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_messages', function (Blueprint $table) {
            $table->dropColumn('resolved_option_text');
        });
    }
};
