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
        Schema::create('survey_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->string('direction', 16);
            $table->string('phone', 32)->nullable();
            $table->string('delivery_status', 32)->nullable();
            $table->text('message');
            $table->timestamps();

            $table->index(['survey_id', 'contact_id', 'created_at']);
            $table->index(['survey_id', 'contact_id', 'direction']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_messages');
    }
};
